const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_PASSES = 5;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const normalizeRecurringFrequency = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "daily" || normalized === "weekly" || normalized === "monthly") {
    return normalized;
  }
  return "weekly";
};

const normalizeRecurringInterval = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.floor(parsed);
};

const addMonthsSafe = (date, months) => {
  const source = new Date(date);
  const day = source.getDate();
  const targetMonthIndex = source.getMonth() + months;
  const targetYear = source.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const next = new Date(source);
  next.setFullYear(targetYear);
  next.setMonth(normalizedMonth, Math.min(day, daysInTargetMonth));
  return next;
};

const addRecurringInterval = (date, frequency, interval) => {
  const safeFrequency = normalizeRecurringFrequency(frequency);
  const safeInterval = normalizeRecurringInterval(interval);
  const next = new Date(date);

  switch (safeFrequency) {
    case "daily":
      next.setDate(next.getDate() + safeInterval);
      return next;
    case "weekly":
      next.setDate(next.getDate() + safeInterval * 7);
      return next;
    case "monthly":
    default:
      return addMonthsSafe(next, safeInterval);
  }
};

const advanceNextRunAt = ({ nextRunAt, frequency, interval, now = new Date() }) => {
  const safeNow = now instanceof Date ? now : new Date(now);
  let next = nextRunAt instanceof Date ? new Date(nextRunAt) : new Date(nextRunAt);
  if (Number.isNaN(next.getTime())) {
    return addRecurringInterval(safeNow, frequency, interval);
  }

  let guard = 0;
  while (next <= safeNow && guard < 500) {
    next = addRecurringInterval(next, frequency, interval);
    guard += 1;
  }

  if (next <= safeNow) {
    return addRecurringInterval(safeNow, frequency, interval);
  }

  return next;
};

const buildRecurringRunNoteId = (userId, templateId, runAt) => {
  const runDate = runAt instanceof Date ? runAt : new Date(runAt);
  const runMs = Number.isFinite(runDate.getTime()) ? runDate.getTime() : Date.now();
  const raw = `recurring_${userId || "user"}_${templateId || "template"}_${runMs}`;
  return raw.replace(/[^a-zA-Z0-9_-]/g, "_");
};

const isProcessorEnabled = (value) => {
  const normalized = String(value ?? "true").trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(normalized);
};

const processTemplateRef = async ({
  db,
  FieldValue,
  templateRef,
  now = new Date(),
}) => {
  const userRef = templateRef.parent?.parent || null;
  const userId = userRef?.id || "";
  if (!userId) return { scanned: 1, advanced: false, created: false };

  return db.runTransaction(async (tx) => {
    const templateSnap = await tx.get(templateRef);
    if (!templateSnap.exists) {
      return { scanned: 1, advanced: false, created: false };
    }

    const template = templateSnap.data() || {};
    const frequency = normalizeRecurringFrequency(template.frequency);
    const interval = normalizeRecurringInterval(template.interval);
    const nextRunAt = toDateValue(template.nextRunAt);
    if (!nextRunAt) {
      const recoveredNextRunAt = addRecurringInterval(now, frequency, interval);
      tx.update(templateRef, {
        nextRunAt: recoveredNextRunAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { scanned: 1, advanced: true, created: false };
    }

    if (nextRunAt > now) {
      return { scanned: 1, advanced: false, created: false };
    }

    const updatedNextRunAt = advanceNextRunAt({
      nextRunAt,
      frequency,
      interval,
      now,
    });

    if (template.active === false) {
      tx.update(templateRef, {
        nextRunAt: updatedNextRunAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { scanned: 1, advanced: true, created: false };
    }

    const userSnap = await tx.get(userRef);
    const userData = userSnap.exists ? userSnap.data() || {} : {};
    const userPlan = String(userData.plan || "").toLowerCase();
    const isPremiumUser = userPlan === "premium";

    if (!isPremiumUser) {
      tx.update(templateRef, {
        nextRunAt: updatedNextRunAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { scanned: 1, advanced: true, created: false };
    }

    const recurringNoteId = buildRecurringRunNoteId(userId, templateRef.id, nextRunAt);
    const noteRef = db.collection("notes").doc(recurringNoteId);
    const noteSnap = await tx.get(noteRef);
    const shouldCreate = !noteSnap.exists;

    if (shouldCreate) {
      tx.set(noteRef, {
        title: template.title || "Untitled note",
        content: template.content || "",
        tags: Array.isArray(template.tags) ? template.tags : [],
        color: template.color || "#ffffff",
        isPinned: !!template.isPinned,
        userId,
        createdAt: FieldValue.serverTimestamp(),
        lastModified: FieldValue.serverTimestamp(),
        dueDate: template.useDueDate ? nextRunAt : null,
        recurringTemplateId: templateRef.id,
        recurringRunAt: nextRunAt,
      });
    }

    tx.update(templateRef, {
      lastCreatedAt: FieldValue.serverTimestamp(),
      nextRunAt: updatedNextRunAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { scanned: 1, advanced: true, created: shouldCreate };
  });
};

const runRecurringPass = async ({
  db,
  FieldValue,
  batchSize = DEFAULT_BATCH_SIZE,
  maxPasses = DEFAULT_MAX_PASSES,
}) => {
  const safeBatchSize = parsePositiveInt(batchSize, DEFAULT_BATCH_SIZE);
  const safeMaxPasses = parsePositiveInt(maxPasses, DEFAULT_MAX_PASSES);
  const totals = { scanned: 0, advanced: 0, created: 0, passes: 0 };

  for (let pass = 0; pass < safeMaxPasses; pass += 1) {
    const now = new Date();
    const snapshot = await db
      .collectionGroup("recurringNotes")
      .where("nextRunAt", "<=", now)
      .limit(safeBatchSize)
      .get();

    if (snapshot.empty) break;
    totals.passes += 1;

    for (const templateDoc of snapshot.docs) {
      const result = await processTemplateRef({
        db,
        FieldValue,
        templateRef: templateDoc.ref,
        now,
      });
      totals.scanned += result.scanned ? 1 : 0;
      totals.advanced += result.advanced ? 1 : 0;
      totals.created += result.created ? 1 : 0;
    }

    if (snapshot.size < safeBatchSize) break;
  }

  return totals;
};

const startRecurringProcessor = ({
  db,
  FieldValue,
  env = process.env,
  logger = console,
} = {}) => {
  if (!db || !FieldValue) return () => {};
  if (!isProcessorEnabled(env.RECURRING_NOTES_ENABLED)) {
    logger.log("Recurring processor disabled (RECURRING_NOTES_ENABLED=false).");
    return () => {};
  }

  const intervalMs = parsePositiveInt(
    env.RECURRING_CHECK_INTERVAL_MS,
    DEFAULT_INTERVAL_MS
  );
  const batchSize = parsePositiveInt(env.RECURRING_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const maxPasses = parsePositiveInt(env.RECURRING_MAX_PASSES, DEFAULT_MAX_PASSES);

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const totals = await runRecurringPass({
        db,
        FieldValue,
        batchSize,
        maxPasses,
      });
      if (totals.scanned > 0) {
        logger.log(
          `Recurring pass scanned=${totals.scanned} advanced=${totals.advanced} created=${totals.created} passes=${totals.passes}`
        );
      }
    } catch (error) {
      logger.error("Recurring processor failed", error);
    } finally {
      running = false;
    }
  };

  void tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);
  if (typeof timer.unref === "function") {
    timer.unref();
  }

  logger.log(
    `Recurring processor enabled (interval=${intervalMs}ms, batchSize=${batchSize}, maxPasses=${maxPasses}).`
  );

  return () => clearInterval(timer);
};

export {
  addRecurringInterval,
  advanceNextRunAt,
  buildRecurringRunNoteId,
  runRecurringPass,
  startRecurringProcessor,
  toDateValue,
};

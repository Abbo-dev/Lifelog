import { useCallback, useEffect, useRef, useState } from "react";

const SETTINGS_PREFIX = "lifelog_reminder_settings_";
const HISTORY_PREFIX = "lifelog_reminder_history_";
const DEFAULT_SETTINGS = { enabled: false, leadMinutes: 0 };
const CHECK_INTERVAL_MS = 30000;
const WINDOW_MS = 2 * 60 * 1000;

const isBrowser = typeof window !== "undefined";
const isNotificationSupported = () => isBrowser && "Notification" in window;

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;

  return new Promise((resolve) => {
    let settled = false;
    const finalize = (value) => {
      if (settled) return;
      settled = true;
      resolve(value || Notification.permission);
    };

    try {
      const result = Notification.requestPermission((permission) => {
        finalize(permission);
      });
      if (result && typeof result.then === "function") {
        result.then(finalize).catch(() => finalize(Notification.permission));
      } else if (typeof result === "string") {
        finalize(result);
      }
    } catch {
      finalize(Notification.permission);
    }
  });
};

const storageKeyFor = (prefix, userId) =>
  `${prefix}${userId && typeof userId === "string" ? userId : "guest"}`;

const readJson = (key) => {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

const normalizeSettings = (value) => {
  const leadMinutes = Number(value?.leadMinutes);
  return {
    enabled: !!value?.enabled,
    leadMinutes: Number.isFinite(leadMinutes) && leadMinutes >= 0 ? leadMinutes : 0,
  };
};

const loadSettings = (storageKey) => {
  const saved = readJson(storageKey);
  return { ...DEFAULT_SETTINGS, ...normalizeSettings(saved || {}) };
};

const loadHistory = (storageKey) => readJson(storageKey) || {};

const saveHistory = (storageKey, history) => writeJson(storageKey, history);

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    "seconds" in value &&
    "nanoseconds" in value
  ) {
    return new Date(
      value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000)
    );
  }
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

const formatReminderTime = (date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

export const showReminderNotification = async ({
  title,
  body,
  data,
  permission,
}) => {
  if (!isNotificationSupported()) return false;
  const resolvedPermission = permission || Notification.permission;
  if (resolvedPermission !== "granted") return false;

  const payload = {
    body,
    tag: data?.noteId ? `note-${data.noteId}` : undefined,
    data,
  };

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, payload);
        return true;
      }
    } catch {
      // Fall back to the window notification API.
    }
  }

  // Fallback to the window notification API.
  try {
    new Notification(title, payload);
    return true;
  } catch {
    return false;
  }
};

export const useReminderSettings = (userId) => {
  const storageKey = storageKeyFor(SETTINGS_PREFIX, userId);
  const [settings, setSettings] = useState(() => loadSettings(storageKey));

  useEffect(() => {
    setSettings(loadSettings(storageKey));
  }, [storageKey]);

  const updateSettings = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = normalizeSettings({ ...prev, ...patch });
        writeJson(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  return { settings, updateSettings };
};

export const useReminderScheduler = ({ notes, userId, settings }) => {
  const notesRef = useRef(notes || []);
  const historyKey = storageKeyFor(HISTORY_PREFIX, userId);

  useEffect(() => {
    notesRef.current = notes || [];
  }, [notes]);

  useEffect(() => {
    if (!settings?.enabled) return undefined;
    if (!isNotificationSupported()) return undefined;

    const leadMs = Math.max(0, Number(settings.leadMinutes) || 0) * 60 * 1000;

    const tick = async () => {
      if (Notification.permission !== "granted") return;

      const now = Date.now();
      const history = loadHistory(historyKey);
      const activeIds = new Set();
      let changed = false;

      for (const note of notesRef.current) {
        const noteId = note?.id;
        if (!noteId) continue;
        if (note?.trashedAt) continue;
        activeIds.add(noteId);

        const dueDate = toDateValue(note?.dueDate);
        if (!dueDate) continue;

        const fireAt = dueDate.getTime() - leadMs;
        if (fireAt > now + WINDOW_MS) continue;
        if (fireAt <= now && now - fireAt <= WINDOW_MS) {
          if (history[noteId] === fireAt) continue;

          const noteTitle = note?.title?.trim() || "Untitled note";
          const dueLabel = formatReminderTime(dueDate);
          const leadLabel =
            settings.leadMinutes > 0
              ? ` (${settings.leadMinutes}m early)`
              : "";

          const shown = await showReminderNotification({
            title: "LifeLog reminder",
            body: `"${noteTitle}" is due ${dueLabel}${leadLabel}. Tap to open.`,
            data: { noteId, url: "/app" },
          });
          if (shown) {
            history[noteId] = fireAt;
            changed = true;
          }
        }
      }

      for (const noteId of Object.keys(history)) {
        if (!activeIds.has(noteId)) {
          delete history[noteId];
          changed = true;
        }
      }

      if (changed) saveHistory(historyKey, history);
    };

    tick();
    const intervalId = window.setInterval(tick, CHECK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [historyKey, settings?.enabled, settings?.leadMinutes]);
};

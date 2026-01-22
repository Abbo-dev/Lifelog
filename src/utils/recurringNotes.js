const FREQUENCIES = new Set(["daily", "weekly", "monthly"]);
const DEFAULT_FREQUENCY = "weekly";
const DEFAULT_INTERVAL = 1;

const addMonthsSafe = (date, months) => {
  const source = new Date(date);
  const day = source.getDate();
  const targetMonthIndex = source.getMonth() + months;
  const targetYear = source.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth =
    ((targetMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(
    targetYear,
    normalizedMonth + 1,
    0
  ).getDate();
  const next = new Date(source);
  next.setFullYear(targetYear);
  next.setMonth(normalizedMonth, Math.min(day, daysInTargetMonth));
  return next;
};

export const normalizeRecurringFrequency = (value) =>
  FREQUENCIES.has(value) ? value : DEFAULT_FREQUENCY;

export const normalizeRecurringInterval = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_INTERVAL;
  return Math.floor(parsed);
};

export const addRecurringInterval = (date, frequency, interval) => {
  const safeInterval = normalizeRecurringInterval(interval);
  const next = new Date(date);

  switch (normalizeRecurringFrequency(frequency)) {
    case "daily":
      next.setDate(next.getDate() + safeInterval);
      return next;
    case "weekly":
      next.setDate(next.getDate() + safeInterval * 7);
      return next;
    case "monthly":
      return addMonthsSafe(next, safeInterval);
    default:
      return addMonthsSafe(next, safeInterval);
  }
};

export const computeNextRunAt = ({ baseDate, frequency, interval }) =>
  addRecurringInterval(baseDate, frequency, interval);

export const advanceNextRunAt = ({
  nextRunAt,
  frequency,
  interval,
  now = new Date(),
}) => {
  const safeNow = now instanceof Date ? now : new Date(now);
  let next =
    nextRunAt instanceof Date ? new Date(nextRunAt) : new Date(nextRunAt);
  if (Number.isNaN(next.getTime())) {
    return computeNextRunAt({
      baseDate: safeNow,
      frequency,
      interval,
    });
  }
  let guard = 0;

  while (next <= safeNow && guard < 500) {
    next = addRecurringInterval(next, frequency, interval);
    guard += 1;
  }

  return next;
};

export const formatRecurringFrequency = (value) => {
  switch (normalizeRecurringFrequency(value)) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    default:
      return "Weekly";
  }
};

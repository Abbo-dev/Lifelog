import test from "node:test";
import assert from "node:assert/strict";
import {
  addRecurringInterval,
  advanceNextRunAt,
  buildRecurringRunNoteId,
  toDateValue,
} from "./recurringProcessor.js";

test("toDateValue parses valid values and rejects invalid", () => {
  assert.equal(toDateValue("2025-01-01T00:00:00Z")?.toISOString(), "2025-01-01T00:00:00.000Z");
  assert.equal(toDateValue("not-a-date"), null);
});

test("buildRecurringRunNoteId returns deterministic sanitized ids", () => {
  const id = buildRecurringRunNoteId("user/1", "template:abc", new Date("2025-01-01T00:00:00Z"));
  assert.equal(id, "recurring_user_1_template_abc_1735689600000");
});

test("addRecurringInterval handles daily and weekly increments", () => {
  const base = new Date("2025-01-01T00:00:00Z");
  assert.equal(
    addRecurringInterval(base, "daily", 2).toISOString(),
    "2025-01-03T00:00:00.000Z"
  );
  assert.equal(
    addRecurringInterval(base, "weekly", 2).toISOString(),
    "2025-01-15T00:00:00.000Z"
  );
});

test("advanceNextRunAt advances past now", () => {
  const next = advanceNextRunAt({
    nextRunAt: new Date("2025-01-01T00:00:00Z"),
    frequency: "weekly",
    interval: 1,
    now: new Date("2025-01-20T00:00:00Z"),
  });
  assert.equal(next.toISOString(), "2025-01-22T00:00:00.000Z");
});

test("advanceNextRunAt guarantees a future date when guard limit is reached", () => {
  const now = new Date("2025-01-20T00:00:00Z");
  const next = advanceNextRunAt({
    nextRunAt: new Date("2020-01-01T00:00:00Z"),
    frequency: "daily",
    interval: 1,
    now,
  });
  assert.equal(next.toISOString(), "2025-01-21T00:00:00.000Z");
});

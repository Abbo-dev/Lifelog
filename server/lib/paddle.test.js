import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  extractUidFromPaddlePayload,
  isPremiumStatus,
  normalizeDateValue,
  parsePaddleSignature,
  resolveNextBilledAt,
  safeJsonParse,
  verifyPaddleWebhook,
} from "./paddle.js";

test("parsePaddleSignature returns null for empty input", () => {
  assert.equal(parsePaddleSignature(""), null);
  assert.equal(parsePaddleSignature(null), null);
});

test("parsePaddleSignature parses ts and h1", () => {
  const header = "ts=1700000000; h1=abc123";
  assert.deepEqual(parsePaddleSignature(header), {
    ts: "1700000000",
    h1: "abc123",
  });
});

test("parsePaddleSignature preserves base64 padding", () => {
  const header = "ts=1700000000; h1=YWJjZA==";
  assert.deepEqual(parsePaddleSignature(header), {
    ts: "1700000000",
    h1: "YWJjZA==",
  });
});

test("verifyPaddleWebhook accepts a valid signature", () => {
  const secret = "test-secret";
  const rawBody = "{\"ok\":true}";
  const ts = Math.floor(Date.now() / 1000);
  const base = `${ts}:${rawBody}`;
  const h1 = crypto.createHmac("sha256", secret).update(base).digest("hex");
  const signatureHeader = `ts=${ts}; h1=${h1}`;

  const result = verifyPaddleWebhook({ rawBody, signatureHeader, secret });
  assert.equal(result.ok, true);
});

test("verifyPaddleWebhook rejects a bad signature", () => {
  const secret = "test-secret";
  const rawBody = "{\"ok\":true}";
  const ts = Math.floor(Date.now() / 1000);
  const signatureHeader = `ts=${ts}; h1=deadbeef`;

  const result = verifyPaddleWebhook({ rawBody, signatureHeader, secret });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "bad_signature");
});

test("verifyPaddleWebhook rejects a skewed timestamp", () => {
  const secret = "test-secret";
  const rawBody = "{\"ok\":true}";
  const ts = Math.floor(Date.now() / 1000) - 600;
  const signatureHeader = `ts=${ts}; h1=abc123`;

  const result = verifyPaddleWebhook({ rawBody, signatureHeader, secret });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "timestamp_skew");
});

test("safeJsonParse returns parsed JSON or null", () => {
  assert.deepEqual(safeJsonParse("{\"a\":1}"), { a: 1 });
  assert.equal(safeJsonParse("{bad}"), null);
});

test("normalizeDateValue handles dates and date-like values", () => {
  const date = new Date("2024-01-01T00:00:00Z");
  assert.equal(normalizeDateValue(date), "2024-01-01T00:00:00.000Z");
  assert.equal(normalizeDateValue("2024-01-01T00:00:00Z"), "2024-01-01T00:00:00.000Z");
  assert.equal(normalizeDateValue({ date: "2024-01-02T00:00:00Z" }), "2024-01-02T00:00:00.000Z");
  assert.equal(normalizeDateValue("not-a-date"), null);
});

test("resolveNextBilledAt picks the first valid candidate", () => {
  const resource = {
    billing_period: { ends_at: "2024-02-01T00:00:00Z" },
    current_period_end: "2024-03-01T00:00:00Z",
  };
  assert.equal(resolveNextBilledAt(resource), "2024-02-01T00:00:00.000Z");
});

test("extractUidFromPaddlePayload reads uid from custom data", () => {
  const event = { data: { custom_data: { firebaseUid: "user-123" } } };
  assert.equal(extractUidFromPaddlePayload(event), "user-123");
});

test("extractUidFromPaddlePayload reads uid from passthrough JSON", () => {
  const event = { data: { passthrough: "{\"firebaseUid\":\"user-456\"}" } };
  assert.equal(extractUidFromPaddlePayload(event), "user-456");
});

test("isPremiumStatus recognizes paid states", () => {
  assert.equal(isPremiumStatus("active"), true);
  assert.equal(isPremiumStatus("trialing"), true);
  assert.equal(isPremiumStatus("past_due"), true);
  assert.equal(isPremiumStatus("canceled"), false);
});

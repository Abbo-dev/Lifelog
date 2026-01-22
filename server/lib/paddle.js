import crypto from "crypto";

const parsePaddleSignature = (headerValue) => {
  const raw = String(headerValue || "").trim();
  if (!raw) return null;

  const parts = raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  const map = {};
  for (const part of parts) {
    const splitIndex = part.indexOf("=");
    if (splitIndex <= 0) continue;
    const key = part.slice(0, splitIndex).trim();
    const value = part.slice(splitIndex + 1).trim();
    if (!key || !value) continue;
    map[key] = value;
  }

  if (!map.ts || !map.h1) return null;
  return { ts: map.ts, h1: map.h1 };
};

const timingSafeEqual = (a, b) => {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const verifyPaddleWebhook = ({ rawBody, signatureHeader, secret }) => {
  const signature = parsePaddleSignature(signatureHeader);
  if (!signature) return { ok: false, reason: "missing_signature" };

  const tsNumber = Number(signature.ts);
  if (!Number.isFinite(tsNumber)) return { ok: false, reason: "bad_timestamp" };

  const nowSeconds = Math.floor(Date.now() / 1000);
  const skew = Math.abs(nowSeconds - tsNumber);
  if (skew > 5 * 60) return { ok: false, reason: "timestamp_skew" };

  const base = `${signature.ts}:${rawBody}`;

  const hex = crypto.createHmac("sha256", secret).update(base).digest("hex");
  const base64 = crypto.createHmac("sha256", secret).update(base).digest("base64");

  const expected =
    signature.h1.length === hex.length
      ? hex
      : signature.h1.length === base64.length
        ? base64
        : hex;

  const ok = timingSafeEqual(expected, signature.h1);
  return ok ? { ok: true } : { ok: false, reason: "bad_signature" };
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === "object" && value.date) {
    return normalizeDateValue(value.date);
  }
  return null;
};

const resolveNextBilledAt = (resource) => {
  const candidates = [
    resource?.next_billed_at,
    resource?.next_payment?.date,
    resource?.billing_period?.ends_at,
    resource?.current_billing_period?.ends_at,
    resource?.current_period?.ends_at,
    resource?.current_period_end,
    resource?.next_payment_at,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeDateValue(candidate);
    if (normalized) return normalized;
  }
  return null;
};

const extractUidFromPaddlePayload = (event) => {
  const data = event?.data || event?.data?.object || {};

  const fromCustomData =
    data?.custom_data?.firebaseUid ||
    data?.custom_data?.uid ||
    event?.custom_data?.firebaseUid ||
    event?.custom_data?.uid;
  if (typeof fromCustomData === "string" && fromCustomData) return fromCustomData;

  const passthroughRaw =
    data?.passthrough || data?.checkout?.passthrough || event?.passthrough;
  if (typeof passthroughRaw === "string" && passthroughRaw) {
    const parsed = safeJsonParse(passthroughRaw);
    const passthroughUid = parsed?.firebaseUid || parsed?.uid;
    if (typeof passthroughUid === "string" && passthroughUid) return passthroughUid;
  }

  return null;
};

const resolvePaddleEventType = (event) =>
  event?.event_type || event?.type || event?.eventType || "";

const resolvePaddleEventId = (event) =>
  event?.event_id || event?.eventId || event?.eventID || event?.id || "";

const resolvePaddleResource = (event) =>
  event?.data || event?.data?.object || event?.data?.data || {};

const normalizeSubscriptionStatus = (status) => String(status || "").toLowerCase();

const isPremiumStatus = (status) => {
  const s = normalizeSubscriptionStatus(status);
  return s === "active" || s === "trialing" || s === "past_due";
};

export {
  extractUidFromPaddlePayload,
  isPremiumStatus,
  normalizeDateValue,
  normalizeSubscriptionStatus,
  parsePaddleSignature,
  resolvePaddleEventId,
  resolveNextBilledAt,
  resolvePaddleEventType,
  resolvePaddleResource,
  safeJsonParse,
  timingSafeEqual,
  verifyPaddleWebhook,
};

const LOCK_STORAGE_VERSION = 1;

const storageAvailable = () => {
  try {
    const key = "__lifelog_lock_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const getLockKey = (userId) =>
  `lifelog_note_lock_v${LOCK_STORAGE_VERSION}_${userId}`;

const bufferToBase64 = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToBuffer = (value) =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

const hasRandomValues = () =>
  typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function";

const hasSubtleCrypto = () =>
  typeof crypto !== "undefined" &&
  crypto.subtle &&
  typeof crypto.subtle.digest === "function";

const hashPasscode = async (passcode, salt) => {
  if (!hasSubtleCrypto()) return null;
  const encoder = new TextEncoder();
  const passBytes = encoder.encode(passcode);
  const data = new Uint8Array(salt.length + passBytes.length);
  data.set(salt);
  data.set(passBytes, salt.length);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToBase64(digest);
};

export const getLockStatus = (userId) => {
  if (!userId || !storageAvailable()) return { hasPasscode: false };
  try {
    const raw = window.localStorage.getItem(getLockKey(userId));
    if (!raw) return { hasPasscode: false };
    const parsed = JSON.parse(raw);
    return { hasPasscode: !!parsed?.salt && !!parsed?.hash };
  } catch {
    return { hasPasscode: false };
  }
};

export const setLockPasscode = async (userId, passcode) => {
  if (!userId || !storageAvailable()) return false;
  if (!hasRandomValues()) return false;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPasscode(passcode, salt);
  if (!hash) return false;
  const payload = {
    salt: bufferToBase64(salt),
    hash,
    createdAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(getLockKey(userId), JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error("Failed to set lock passcode", error);
    return false;
  }
};

export const verifyLockPasscode = async (userId, passcode) => {
  if (!userId || !storageAvailable()) return false;
  try {
    const raw = window.localStorage.getItem(getLockKey(userId));
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const salt = parsed?.salt ? base64ToBuffer(parsed.salt) : null;
    if (!salt) return false;
    const hash = await hashPasscode(passcode, salt);
    if (!hash) return false;
    return hash === parsed.hash;
  } catch (error) {
    console.error("Failed to verify lock passcode", error);
    return false;
  }
};

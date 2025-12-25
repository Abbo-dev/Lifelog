import { useCallback, useEffect, useMemo, useState } from "react";

const LOCAL_PRO_VERSION = 1;
const LOCAL_PRO_EVENT = "lifelog:local-pro";

const getStorageKey = (userId) =>
  `lifelog_local_pro_v${LOCAL_PRO_VERSION}_${userId || "guest"}`;

const readEnabled = (userId) => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(getStorageKey(userId)) === "1";
  } catch {
    return false;
  }
};

const writeEnabled = (userId, enabled) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(userId), enabled ? "1" : "0");
  } catch {
    // ignore storage failures
  }
};

const getCode = () => (import.meta.env.VITE_LOCAL_PRO_CODE || "").trim();

export const useLocalPro = (userId) => {
  const [enabled, setEnabled] = useState(() => readEnabled(userId));
  const isCodeConfigured = useMemo(() => getCode().length > 0, []);

  useEffect(() => {
    setEnabled(readEnabled(userId));
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleSync = () => setEnabled(readEnabled(userId));
    window.addEventListener("storage", handleSync);
    window.addEventListener(LOCAL_PRO_EVENT, handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(LOCAL_PRO_EVENT, handleSync);
    };
  }, [userId]);

  const setProEnabled = useCallback(
    (value) => {
      const next = !!value;
      writeEnabled(userId, next);
      setEnabled(next);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(LOCAL_PRO_EVENT));
      }
    },
    [userId]
  );

  const unlockWithCode = useCallback(
    (code) => {
      const expected = getCode();
      if (!expected) return { ok: false, reason: "missing_code" };
      if ((code || "").trim() !== expected) {
        return { ok: false, reason: "invalid_code" };
      }
      setProEnabled(true);
      return { ok: true };
    },
    [setProEnabled]
  );

  return {
    enabled,
    isCodeConfigured,
    setProEnabled,
    unlockWithCode,
  };
};

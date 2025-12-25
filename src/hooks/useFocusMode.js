import { useCallback, useEffect, useState } from "react";

const FOCUS_STORAGE_KEY = "lifelog_focus_mode";

const readFocusSetting = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FOCUS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const writeFocusSetting = (enabled) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOCUS_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage failures
  }
};

const applyFocusMode = (enabled) => {
  if (typeof document === "undefined") return;
  document.body.dataset.focus = enabled ? "on" : "off";
};

export const useFocusMode = () => {
  const [enabled, setEnabled] = useState(() => readFocusSetting());

  useEffect(() => {
    applyFocusMode(enabled);
    writeFocusSetting(enabled);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lifelog:focus-mode"));
    }
  }, [enabled]);

  useEffect(() => {
    const handleSync = () => {
      const next = readFocusSetting();
      setEnabled(next);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleSync);
      window.addEventListener("lifelog:focus-mode", handleSync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleSync);
        window.removeEventListener("lifelog:focus-mode", handleSync);
      }
    };
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, setEnabled, toggle };
};

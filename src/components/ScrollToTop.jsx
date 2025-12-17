import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [pathname]);

  return null;
}

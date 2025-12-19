const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const isRelativeHref = (href) => href.startsWith("/") || href.startsWith("#") || href.startsWith("?");

export const ensureProtocol = (href = "") => {
  const trimmed = href.trim();
  if (!trimmed) return "";
  if (isRelativeHref(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return trimmed;

  const candidate = trimmed.includes("://") ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const parsed = new URL(candidate);
    if (!SAFE_HTTP_PROTOCOLS.has(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
};

export const sanitizeHtmlLinks = (html = "") => {
  if (typeof html !== "string" || !html.includes("<a")) return html || "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("a").forEach((anchor) => {
      const hrefWithProtocol = ensureProtocol(anchor.getAttribute("href") || "");
      if (!hrefWithProtocol) {
        anchor.removeAttribute("href");
        anchor.removeAttribute("target");
        anchor.removeAttribute("rel");
        return;
      }
      anchor.setAttribute("href", hrefWithProtocol);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

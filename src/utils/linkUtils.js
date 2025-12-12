const PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

export const ensureProtocol = (href = "") => {
  const trimmed = href.trim();
  if (!trimmed) return "";
  if (PROTOCOL_REGEX.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

export const sanitizeHtmlLinks = (html = "") => {
  if (typeof html !== "string" || !html.includes("<a")) return html || "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("a").forEach((anchor) => {
      const hrefWithProtocol = ensureProtocol(anchor.getAttribute("href") || "");
      if (!hrefWithProtocol) return;
      anchor.setAttribute("href", hrefWithProtocol);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

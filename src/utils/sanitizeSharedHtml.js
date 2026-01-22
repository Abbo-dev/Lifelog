import { ensureProtocol } from "./linkUtils";

const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);

const ALLOWED_STYLE_PROPERTIES = new Set(["color", "background-color", "text-align"]);

const sanitizeStyleValue = (property, value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.includes("url(") || lower.includes("expression") || lower.includes("javascript:")) {
    return "";
  }

  if (property === "text-align") {
    return ["left", "right", "center", "justify", "start", "end"].includes(lower)
      ? lower
      : "";
  }

  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed;
  if (
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.test(
      trimmed
    )
  ) {
    return trimmed;
  }
  if (/^hsla?\([^)]*\)$/i.test(trimmed)) return trimmed;
  if (["transparent", "currentcolor", "inherit"].includes(lower)) return lower;

  return "";
};

const sanitizeInlineStyle = (style = "") => {
  const declarations = style.split(";");
  const kept = [];

  for (const declaration of declarations) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    if (!rawProperty || rawValueParts.length === 0) continue;
    const property = rawProperty.trim().toLowerCase();
    if (!ALLOWED_STYLE_PROPERTIES.has(property)) continue;
    const value = rawValueParts.join(":").trim();
    const sanitized = sanitizeStyleValue(property, value);
    if (!sanitized) continue;
    kept.push(`${property}: ${sanitized}`);
  }

  return kept.join("; ");
};

const isSafeDataImage = (value) =>
  /^data:image\/(png|jpe?g|gif|webp);/i.test(value);

const sanitizeImageSrc = (src = "", { allowDataImages = false } = {}) => {
  const trimmed = src.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase().startsWith("data:")) {
    return allowDataImages && isSafeDataImage(trimmed) ? trimmed : "";
  }

  try {
    const url = new URL(
      trimmed,
      typeof window !== "undefined" ? window.location.origin : "https://example.com"
    );
    if (!SAFE_HTTP_PROTOCOLS.has(url.protocol)) return "";
    return url.toString();
  } catch {
    const normalized = ensureProtocol(trimmed);
    if (!normalized) return "";
    try {
      const url = new URL(normalized);
      if (!SAFE_HTTP_PROTOCOLS.has(url.protocol)) return "";
      return url.toString();
    } catch {
      return "";
    }
  }
};

const sanitizeHtml = (html = "", { allowDataImages = false } = {}) => {
  if (typeof html !== "string") return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return html;

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc
      .querySelectorAll(
        "script, style, iframe, object, embed, link, meta, base, form, input, textarea, button, select, option, svg, math, video, audio, source"
      )
      .forEach((node) => node.remove());

    doc.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) node.removeAttribute(attr.name);
        if (name === "srcset" || name === "formaction") {
          node.removeAttribute(attr.name);
        }
      });

      const style = node.getAttribute("style");
      if (style) {
        const sanitizedStyle = sanitizeInlineStyle(style);
        if (sanitizedStyle) {
          node.setAttribute("style", sanitizedStyle);
        } else {
          node.removeAttribute("style");
        }
      }
    });

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

    doc.querySelectorAll("img").forEach((img) => {
      const sanitizedSrc = sanitizeImageSrc(img.getAttribute("src") || "", {
        allowDataImages,
      });
      if (!sanitizedSrc) {
        img.remove();
        return;
      }

      img.setAttribute("src", sanitizedSrc);
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      [...img.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (
          ![
            "src",
            "alt",
            "title",
            "width",
            "height",
            "loading",
            "decoding",
          ].includes(name)
        ) {
          img.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

export const sanitizeHtmlForPublicShare = (html = "") =>
  sanitizeHtml(html, { allowDataImages: false });

export const sanitizeHtmlForNotes = (html = "") =>
  sanitizeHtml(html, { allowDataImages: true });

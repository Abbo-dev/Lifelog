const TAG_COLOR_PALETTE = [
  "#5EA2EF",
  "#00C48C",
  "#F5A524",
  "#F31260",
  "#9353D3",
  "#0072F5",
  "#1B2333",
];

export const isHexColor = (value) =>
  typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value.trim());

const hashString = (value) => {
  const text = typeof value === "string" ? value : "";
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getFallbackTagColor = (tag) => {
  const text = typeof tag === "string" ? tag.trim() : "";
  if (!text) return "#0072F5";
  const index = hashString(text) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index] || "#0072F5";
};

export const resolveTagColor = (tag, tagColors = {}) => {
  const text = typeof tag === "string" ? tag.trim() : "";
  if (!text) return "#0072F5";
  const stored = tagColors?.[text];
  return isHexColor(stored) ? stored.trim() : getFallbackTagColor(text);
};

export const normalizeTagColorMap = (value) => {
  if (!value || typeof value !== "object") return {};
  const next = {};
  Object.entries(value).forEach(([tag, color]) => {
    if (typeof tag !== "string") return;
    if (!isHexColor(color)) return;
    next[tag] = color.trim();
  });
  return next;
};

export const hexToRgba = (hex, alpha = 1) => {
  if (!isHexColor(hex)) return `rgba(0, 114, 245, ${alpha})`;
  const safeAlpha = Math.min(1, Math.max(0, Number(alpha) || 0));
  const value = hex.trim().slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

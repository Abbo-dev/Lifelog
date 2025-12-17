const EXPORT_KIND = "lifelog.notes";
const EXPORT_VERSION = 1;

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
    return new Date(
      value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000)
    );
  }
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  return null;
};

const toIsoString = (value) => {
  const date = toDateValue(value);
  return date ? date.toISOString() : null;
};

const normalizeStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

export const buildNotesJsonExport = (notes = []) => ({
  kind: EXPORT_KIND,
  version: EXPORT_VERSION,
  exportedAt: new Date().toISOString(),
  notes: (Array.isArray(notes) ? notes : []).map((note) => ({
    id: typeof note?.id === "string" ? note.id : "",
    title: typeof note?.title === "string" ? note.title : "",
    content: typeof note?.content === "string" ? note.content : "",
    dueDate: toIsoString(note?.dueDate),
    tags: normalizeStringArray(note?.tags),
    color: typeof note?.color === "string" ? note.color : "#ffffff",
    isPinned: !!note?.isPinned,
    createdAt: toIsoString(note?.createdAt),
    lastModified: toIsoString(note?.lastModified),
    trashedAt: toIsoString(note?.trashedAt),
  })),
});

export const parseNotesJsonImport = (text) => {
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) {
    return { notes: parsed, isLifeLogExport: false };
  }

  const notes = Array.isArray(parsed?.notes) ? parsed.notes : null;
  if (!notes) throw new Error("Invalid JSON import: missing notes array.");

  return {
    notes,
    isLifeLogExport: parsed?.kind === EXPORT_KIND,
  };
};

const escapeHtml = (value) =>
  (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeMarkdown = (value) =>
  (value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("*", "\\*")
    .replaceAll("_", "\\_")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");

const nodeToMarkdown = (node, ctx) => {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeMarkdown(node.nodeValue || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node;
  const tagName = element.tagName?.toLowerCase() || "";

  const childrenMarkdown = () =>
    Array.from(element.childNodes)
      .map((child) => nodeToMarkdown(child, ctx))
      .join("");

  switch (tagName) {
    case "br":
      return "\n";
    case "p": {
      const inner = childrenMarkdown().trim();
      return inner ? `${inner}\n\n` : "\n";
    }
    case "strong":
    case "b":
      return `**${childrenMarkdown().trim()}**`;
    case "em":
    case "i":
      return `*${childrenMarkdown().trim()}*`;
    case "s":
    case "del":
    case "strike":
      return `~~${childrenMarkdown().trim()}~~`;
    case "code": {
      const text = (element.textContent || "").replaceAll("`", "\\`");
      return `\`${text}\``;
    }
    case "pre": {
      const text = element.textContent || "";
      return `\n\n\`\`\`\n${text.replace(/\n$/, "")}\n\`\`\`\n\n`;
    }
    case "a": {
      const href = element.getAttribute("href") || "";
      const label = childrenMarkdown().trim() || href;
      return href ? `[${label}](${href})` : label;
    }
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = Number(tagName.slice(1)) || 1;
      const hashes = "#".repeat(Math.min(6, Math.max(1, level)));
      const inner = childrenMarkdown().trim();
      return `${hashes} ${inner}\n\n`;
    }
    case "ul":
    case "ol": {
      const isOrdered = tagName === "ol";
      const listItems = Array.from(element.children).filter(
        (child) => child.tagName?.toLowerCase() === "li"
      );
      const lines = listItems
        .map((li, index) => {
          const checkbox = li.querySelector?.('input[type="checkbox"]');
          const checkboxPrefix =
            checkbox && checkbox instanceof HTMLInputElement
              ? checkbox.checked
                ? "[x] "
                : "[ ] "
              : "";

          const prefix = isOrdered ? `${index + 1}. ` : "- ";
          const bodyNodes = Array.from(li.childNodes).filter((child) => {
            const name = child?.nodeType === Node.ELEMENT_NODE ? child.tagName?.toLowerCase() : "";
            return name !== "ul" && name !== "ol";
          });

          const body = bodyNodes
            .map((child) => nodeToMarkdown(child, { ...ctx, inline: true }))
            .join("")
            .trim();

          const nested = Array.from(li.children).filter((child) => {
            const name = child.tagName?.toLowerCase();
            return name === "ul" || name === "ol";
          });

          const nestedMarkdown = nested
            .map((child) =>
              nodeToMarkdown(child, { ...ctx, indent: `${ctx.indent}  ` })
            )
            .join("")
            .trimEnd();

          const line = `${ctx.indent}${prefix}${checkboxPrefix}${body}`;
          return nestedMarkdown
            ? `${line}\n${nestedMarkdown}\n`
            : `${line}\n`;
        })
        .join("");
      return `\n${lines}\n`;
    }
    case "blockquote": {
      const inner = childrenMarkdown()
        .trim()
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      return `${inner}\n\n`;
    }
    default:
      return childrenMarkdown();
  }
};

export const htmlToMarkdown = (html = "") => {
  if (typeof html !== "string" || !html.trim()) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const root = doc.body;
    const markdown = Array.from(root.childNodes)
      .map((node) => nodeToMarkdown(node, { indent: "", inline: false }))
      .join("")
      .trim();
    return markdown;
  } catch {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
};

const inlineMarkdownToHtml = (text) => {
  const escaped = escapeHtml(text);
  const withCode = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
  const withLinks = withCode.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label, href) => `<a href="${escapeHtml(href)}">${label}</a>`
  );
  const withBold = withLinks.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return withItalic;
};

export const markdownToHtml = (markdown = "") => {
  const input = typeof markdown === "string" ? markdown : "";
  const lines = input.replace(/\r\n/g, "\n").split("\n");

  let html = "";
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
    if (inOl) {
      html += "</ol>";
      inOl = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      html += `<h${level}>${inlineMarkdownToHtml(headingMatch[2].trim())}</h${level}>`;
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      if (inUl) closeLists();
      if (!inOl) {
        html += "<ol>";
        inOl = true;
      }
      html += `<li>${inlineMarkdownToHtml(orderedMatch[2].trim())}</li>`;
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      if (inOl) closeLists();
      if (!inUl) {
        html += "<ul>";
        inUl = true;
      }
      html += `<li>${inlineMarkdownToHtml(unorderedMatch[1].trim())}</li>`;
      continue;
    }

    closeLists();
    html += `<p>${inlineMarkdownToHtml(trimmed)}</p>`;
  }

  closeLists();
  return html;
};

export const buildNotesMarkdownExport = (notes = []) => {
  const exportedAt = new Date().toISOString();
  const header = `<!-- LifeLogExport:v1 -->\n<!-- exportedAt:${exportedAt} -->\n\n`;

  const blocks = (Array.isArray(notes) ? notes : []).map((note, index) => {
    const id = typeof note?.id === "string" ? note.id : "";
    const title = typeof note?.title === "string" && note.title.trim() ? note.title.trim() : "Untitled note";

    const tags = normalizeStringArray(note?.tags).join(", ");
    const createdAt = toIsoString(note?.createdAt) || "";
    const lastModified = toIsoString(note?.lastModified) || "";
    const dueDate = toIsoString(note?.dueDate) || "";
    const trashedAt = toIsoString(note?.trashedAt) || "";
    const color = typeof note?.color === "string" ? note.color : "#ffffff";
    const pinned = note?.isPinned ? "true" : "false";

    const markdownContent = htmlToMarkdown(note?.content || "");

    const metaLines = [
      `- Tags: ${tags}`,
      `- Created: ${createdAt}`,
      `- Updated: ${lastModified}`,
      `- Due: ${dueDate}`,
      `- Color: ${color}`,
      `- Pinned: ${pinned}`,
      `- Trashed: ${trashedAt}`,
    ].join("\n");

    const separator = index === 0 ? "" : "\n\n";
    return (
      `${separator}<!-- NOTE:id=${escapeHtml(id)} -->\n` +
      `## ${escapeMarkdown(title)}\n` +
      `${metaLines}\n\n` +
      `${markdownContent}\n`
    );
  });

  return header + blocks.join("").trimEnd() + "\n";
};

export const parseNotesMarkdownImport = (markdown, { fallbackTitle } = {}) => {
  const input = typeof markdown === "string" ? markdown : "";
  const isLifeLogExport = input.includes("<!-- LifeLogExport:v1 -->");

  if (!isLifeLogExport) {
    const titleMatch = input.match(/^#{1,6}\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || fallbackTitle || "Imported note";
    return {
      isLifeLogExport: false,
      notes: [
        {
          title,
          content: markdownToHtml(input),
        },
      ],
    };
  }

  const noteRegex =
    /<!-- NOTE:id=([^>]+) -->\s*([\s\S]*?)(?=(?:\n<!-- NOTE:id=)|\s*$)/g;
  const notes = [];
  let match;
  while ((match = noteRegex.exec(input))) {
    const id = match[1]?.trim() || "";
    const block = match[2] || "";
    const lines = block.replace(/\r\n/g, "\n").split("\n");

    const titleLine = lines.find((line) => line.trim().startsWith("## "));
    const title = titleLine ? titleLine.replace(/^##\s+/, "").trim() : "Untitled note";

    const meta = {};
    let contentStartIndex = 0;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (line.startsWith("## ")) continue;
      if (line.startsWith("- ")) {
        const [keyRaw, ...rest] = line.slice(2).split(":");
        const key = (keyRaw || "").trim().toLowerCase();
        const value = rest.join(":").trim();
        meta[key] = value;
        continue;
      }
      if (!line) continue;
      contentStartIndex = i;
      break;
    }

    const contentMarkdown = lines.slice(contentStartIndex).join("\n").trim();
    notes.push({
      id,
      title,
      content: markdownToHtml(contentMarkdown),
      tags: (meta.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: meta.created || null,
      lastModified: meta.updated || null,
      dueDate: meta.due || null,
      color: meta.color || "#ffffff",
      isPinned: meta.pinned === "true",
      trashedAt: meta.trashed || null,
    });
  }

  return { isLifeLogExport: true, notes };
};


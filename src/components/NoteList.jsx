/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowUturnLeftIcon as RestoreIcon,
  MapPinIcon as PinIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  LinkIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/outline";
import { sanitizeHtmlLinks } from "../utils/linkUtils";
import { hexToRgba, resolveTagColor } from "../utils/tagColors";
import { loadNoteHistory } from "../utils/localNoteHistory";
import { htmlToMarkdown } from "../utils/notePortability";

const NoteList = ({
  notes,
  onEdit,
  onDelete,
  onPin,
  onShare,
  onUnshare,
  onRestore,
  onRestoreVersion,
  onDeleteForever,
  onToggleLock,
  tagColors = {},
  viewMode = "grid",
  mode = "active",
  userId = "",
}) => {
  const [openNote, setOpenNote] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [copiedShareId, setCopiedShareId] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  useEffect(() => {
    if (mode === "trashSelect") {
      setOpenNote(null);
    }
  }, [mode]);

  useEffect(() => {
    if (!openNote?.id) return;
    const updated = notes.find((note) => note?.id === openNote.id);
    if (updated) {
      setOpenNote(updated);
    }
  }, [notes, openNote?.id]);

  useEffect(() => {
    setShowHistory(false);
  }, [openNote?.id]);

  const toDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
      return new Date(
        value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000)
      );
    }
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value.toDate === "function") {
      try {
        return value.toDate();
      } catch (err) {
        console.error("Failed to convert timestamp", err);
        return null;
      }
    }
    return null;
  };

  const formatDateValue = (value, pattern) => {
    const date = toDateValue(value);
    return date ? format(date, pattern) : "";
  };
  const openNoteDueLabel = openNote
    ? formatDateValue(openNote.dueDate, "MMM d, h:mm a")
    : "";
  const openNoteLastModifiedLabel = openNote
    ? formatDateValue(openNote.lastModified || openNote.createdAt, "MMM d, h:mm a")
    : "";
  const openNoteCreatedLabel = openNote
    ? formatDateValue(openNote.createdAt, "MMM d, h:mm a")
    : "";
  const sanitizedOpenContent = sanitizeHtmlLinks(openNote?.content || "");
  const openNoteLocked = !!openNote?.locked;
  const shareEnabled = typeof onShare === "function";
  const shareUrl = openNote?.shareId
    ? `${window.location.origin}/share/${openNote.shareId}`
    : "";

  const refreshHistory = () => {
    if (!userId || !openNote?.id) {
      setHistoryItems([]);
      return [];
    }
    const history = loadNoteHistory(userId, openNote.id);
    setHistoryItems(history);
    return history;
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      refreshHistory();
    }
    setShowHistory((prev) => !prev);
  };

  const downloadTextFile = (filename, contents, mimeType) => {
    const blob = new Blob([contents], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const buildExportName = (title, ext) => {
    const safe =
      title
        ?.toLowerCase()
        ?.replace(/[^a-z0-9]+/g, "-")
        ?.replace(/^-+|-+$/g, "")
        ?.slice(0, 48) || "note";
    return `lifelog-${safe}.${ext}`;
  };

  const handleExportMarkdown = () => {
    if (!openNote) return;
    const markdown = htmlToMarkdown(openNote.content || "");
    const header = `# ${openNote.title || "Untitled note"}\n\n`;
    downloadTextFile(
      buildExportName(openNote.title, "md"),
      `${header}${markdown}`.trim() + "\n",
      "text/markdown"
    );
  };

  const handleExportPdf = () => {
    if (!openNote) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;

    const title = openNote.title || "LifeLog note";
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title.replace(/</g, "&lt;")}</title>
          <style>
            body { font-family: "Kanit", "Poppins", system-ui, sans-serif; padding: 32px; color: #0f172a; }
            h1 { font-size: 22px; margin-bottom: 16px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
            .content { line-height: 1.6; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h1>${title.replace(/</g, "&lt;")}</h1>
          <div class="meta">Exported from LifeLog</div>
          <div class="content">${sanitizedOpenContent}</div>
        </body>
      </html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const extractPreviewText = (html) =>
    (html || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const copyText = async (text) => {
    if (!text) return false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall back
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyShareLink = async () => {
    if (!openNote?.shareId) return;
    const ok = await copyText(`${window.location.origin}/share/${openNote.shareId}`);
    if (!ok) return;
    setCopiedShareId(openNote.shareId);
    window.setTimeout(() => setCopiedShareId(""), 1400);
  };

  const handleShareAction = async () => {
    if (!openNote) return;
    if (!shareEnabled) return;

    if (openNote.shareId) {
      await handleCopyShareLink();
      return;
    }

    setShareBusy(true);
    try {
      const shareId = await onShare(openNote);
      if (!shareId) return;
      const ok = await copyText(`${window.location.origin}/share/${shareId}`);
      if (!ok) return;
      setCopiedShareId(shareId);
      window.setTimeout(() => setCopiedShareId(""), 1400);
    } finally {
      setShareBusy(false);
    }
  };

  const handleUnshareAction = async () => {
    if (!openNote?.shareId) return;
    if (typeof onUnshare !== "function") return;
    setShareBusy(true);
    try {
      await onUnshare(openNote);
      setCopiedShareId("");
    } finally {
      setShareBusy(false);
    }
  };

  const NoteCard = ({ note }) => {
    const isLocked = !!note.locked;
    const dueDateLabel = formatDateValue(note.dueDate, "MMM d, h:mm a");
    const lastModifiedLabel = formatDateValue(
      note.lastModified || note.createdAt,
      "MMM d, h:mm a"
    );
    const createdLabel = formatDateValue(note.createdAt, "MMM d, h:mm a");
    const sanitizedPreviewContent = isLocked
      ? ""
      : sanitizeHtmlLinks(note.content || "");
    const isTrashMode = mode === "trash";
    const isTrashSelectMode = mode === "trashSelect";

    return (
      <div
        key={note.id}
        onClick={isTrashSelectMode ? undefined : () => setOpenNote(note)}
        className={`group relative bg-[var(--surface-2)] dark:bg-slate-900/90 border border-[color:var(--surface-border)] dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0072F5]/15 ${
          !isTrashMode && note.isPinned ? "border-[#0072F5]" : ""
        } ${isTrashSelectMode ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: note.color || "#0072F5" }} />
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 line-clamp-2 flex-1">
              {isLocked ? "Locked note" : note.title}
            </h3>
            <div className="flex items-center gap-1">
              {isTrashMode ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore?.(note);
                    }}
                    className="p-1 text-gray-500 hover:text-emerald-600 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Restore note"
                    type="button"
                  >
                    <RestoreIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteForever?.(note);
                    }}
                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Delete forever"
                    type="button"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : isTrashSelectMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(note);
                  }}
                  className="p-1 text-gray-500 hover:text-red-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Move to trash"
                  type="button"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  {typeof onToggleLock === "function" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock?.(note);
                      }}
                      className="p-1 text-gray-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label={isLocked ? "Unlock note" : "Lock note"}
                      type="button"
                    >
                      {isLocked ? (
                        <LockClosedIcon className="w-3.5 h-3.5" />
                      ) : (
                        <LockOpenIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : null}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPin?.(note);
                    }}
                    className={`p-1 rounded-lg transition-colors ${
                      note.isPinned
                        ? "text-[#0072F5] hover:bg-[#0072F5]/10"
                        : "text-gray-500 hover:text-gray-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                    aria-label="Pin note"
                    type="button"
                    disabled={isLocked}
                  >
                    <PinIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(note);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Edit note"
                    type="button"
                    disabled={isLocked}
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none mb-2">
            <div
              className="note-content text-[13px] leading-relaxed text-slate-600 dark:text-gray-300 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: sanitizedPreviewContent }}
            />
            {isLocked && (
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Locked · enter passcode to view
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {!isLocked &&
              note.tags?.map((tag) => {
                const tagColor = resolveTagColor(tag, tagColors);
                return (
                  <span
                    key={tag}
                    style={{
                      borderColor: tagColor,
                      backgroundColor: hexToRgba(tagColor, 0.14),
                    }}
                    className="px-2 py-0.5 rounded-full text-[11px] border text-slate-700 dark:text-gray-200"
                  >
                    {tag}
                  </span>
                );
              })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              {!isLocked && dueDateLabel && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span className="uppercase text-[10px] tracking-wide text-slate-400 dark:text-gray-500">
                    Due
                  </span>
                  <span>{dueDateLabel}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              <span className="uppercase text-[10px] tracking-wide text-slate-400 dark:text-gray-500">
                {note.lastModified ? "Updated" : "Created"}
              </span>
              <span>{lastModifiedLabel || createdLabel || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
        {notes.length === 0 && (
          <div className="col-span-full text-center py-8 text-xs text-gray-500">
            {mode === "trash"
              ? "No notes in trash."
              : "No notes found. Create your first note!"}
          </div>
        )}
      </div>

      {openNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
          <div className="relative w-full max-w-3xl bg-[var(--surface-2)] dark:bg-slate-900 rounded-2xl border border-[color:var(--surface-border)] dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-gray-800">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                  Note preview
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
                  {openNoteLocked ? "Locked note" : openNote.title || "Untitled note"}
                </h3>
                <div className="text-[11px] text-slate-500 dark:text-gray-400 flex flex-wrap gap-2">
                  {!openNoteLocked &&
                    openNote.tags?.map((tag) => {
                      const tagColor = resolveTagColor(tag, tagColors);
                      return (
                        <span
                          key={tag}
                          style={{
                            borderColor: tagColor,
                            backgroundColor: hexToRgba(tagColor, 0.14),
                          }}
                          className="px-2 py-0.5 rounded-full border text-slate-600 dark:text-gray-200"
                        >
                          #{tag}
                        </span>
                      );
                    })}
                  {!openNoteLocked && openNoteDueLabel && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span className="uppercase text-[10px] tracking-wide text-slate-400 dark:text-gray-500">
                        Due
                      </span>
                      {openNoteDueLabel}
                    </span>
                  )}
                  {openNoteLastModifiedLabel && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      <span className="uppercase text-[10px] tracking-wide text-slate-400 dark:text-gray-500">
                        {openNote?.lastModified ? "Updated" : "Created"}
                      </span>
                      {openNoteLastModifiedLabel || openNoteCreatedLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {mode === "trash" ? (
                  <>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded-lg border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      onClick={() => {
                        onRestore?.(openNote);
                        setOpenNote(null);
                      }}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={() => {
                        onDeleteForever?.(openNote);
                        setOpenNote(null);
                      }}
                    >
                      Delete forever
                    </button>
                  </>
                ) : null}
                {mode === "active" && !openNoteLocked ? (
                  <>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800"
                      onClick={handleExportMarkdown}
                    >
                      Export MD
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800"
                      onClick={handleExportPdf}
                    >
                      Export PDF
                    </button>
                  </>
                ) : null}
                {mode === "active" &&
                !openNoteLocked &&
                typeof onRestoreVersion === "function" &&
                userId ? (
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800"
                    onClick={handleToggleHistory}
                  >
                    {showHistory ? "Back" : "History"}
                  </button>
                ) : null}
                {mode === "active" && shareEnabled && !openNoteLocked ? (
                  openNote?.shareId ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[#0072F5]/30 text-[#0052CC] dark:text-[#5EA2EF] hover:bg-[#0072F5]/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={handleCopyShareLink}
                        disabled={shareBusy}
                        title={shareUrl}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        {copiedShareId === openNote.shareId ? "Copied" : "Copy link"}
                      </button>
                      {typeof onUnshare === "function" ? (
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={handleUnshareAction}
                          disabled={shareBusy}
                        >
                          Unshare
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[#0072F5]/30 text-[#0052CC] dark:text-[#5EA2EF] hover:bg-[#0072F5]/10 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={handleShareAction}
                      disabled={shareBusy}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      {shareBusy ? "Sharing…" : "Share link"}
                    </button>
                  )
                ) : null}
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-800"
                  onClick={() => setOpenNote(null)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {showHistory ? (
                <div className="space-y-3">
                  {historyItems.length === 0 ? (
                    <div className="text-sm text-slate-600 dark:text-gray-300">
                      No history yet. Save edits to create versions.
                    </div>
                  ) : (
                    historyItems.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-slate-200/80 dark:border-gray-800 bg-white/70 dark:bg-white/5 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {formatDateValue(entry.savedAt, "MMM d, h:mm a")}
                            </p>
                            <p className="text-sm font-medium text-slate-900 dark:text-gray-100">
                              {entry.snapshot?.title || "Untitled note"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {extractPreviewText(entry.snapshot?.content || "") ||
                                "No content preview."}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs rounded-lg border border-[#0072F5]/30 text-[#0052CC] dark:text-[#5EA2EF] hover:bg-[#0072F5]/10"
                            onClick={() => {
                              onRestoreVersion?.(openNote, entry.snapshot);
                              setShowHistory(false);
                            }}
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : openNoteLocked ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <p className="text-sm text-slate-600 dark:text-gray-300">
                    This note is locked. Enter your passcode to view it.
                  </p>
                  {typeof onToggleLock === "function" ? (
                    <button
                      type="button"
                      className="px-4 py-2 text-xs rounded-lg border border-[#0072F5]/30 text-[#0052CC] dark:text-[#5EA2EF] hover:bg-[#0072F5]/10"
                      onClick={() => onToggleLock?.(openNote)}
                    >
                      Unlock note
                    </button>
                  ) : null}
                </div>
              ) : (
                <div
                  className="note-content prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: sanitizedOpenContent }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteList;

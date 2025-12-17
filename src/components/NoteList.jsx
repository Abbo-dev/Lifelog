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
} from "@heroicons/react/24/outline";
import { sanitizeHtmlLinks } from "../utils/linkUtils";

const NoteList = ({
  notes,
  onEdit,
  onDelete,
  onPin,
  onRestore,
  onDeleteForever,
  viewMode = "grid",
  mode = "active",
}) => {
  const [openNote, setOpenNote] = useState(null);
  useEffect(() => {
    if (mode === "trashSelect") {
      setOpenNote(null);
    }
  }, [mode]);

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

  const NoteCard = ({ note }) => {
    const dueDateLabel = formatDateValue(note.dueDate, "MMM d, h:mm a");
    const lastModifiedLabel = formatDateValue(
      note.lastModified || note.createdAt,
      "MMM d, h:mm a"
    );
    const createdLabel = formatDateValue(note.createdAt, "MMM d, h:mm a");
    const sanitizedPreviewContent = sanitizeHtmlLinks(note.content || "");
    const isTrashMode = mode === "trash";
    const isTrashSelectMode = mode === "trashSelect";

    return (
      <div
        key={note.id}
        onClick={isTrashSelectMode ? undefined : () => setOpenNote(note)}
        className={`group relative bg-[#eef3ff] dark:bg-slate-900/90 border border-[#d6e4ff]/80 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0072F5]/15 ${
          !isTrashMode && note.isPinned ? "border-[#0072F5]" : ""
        } ${isTrashSelectMode ? "cursor-default" : "cursor-pointer"}`}
      >
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: note.color || "#0072F5" }} />
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 line-clamp-2 flex-1">
              {note.title}
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
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {note.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-[#2a2a2a] dark:text-gray-300 rounded-full text-[11px]"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              {dueDateLabel && (
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
          <div className="relative w-full max-w-3xl bg-[#eef3ff] dark:bg-slate-900 rounded-2xl border border-[#d6e4ff]/80 dark:border-gray-800 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-gray-800">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                  Note preview
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
                  {openNote.title || "Untitled note"}
                </h3>
                <div className="text-[11px] text-slate-500 dark:text-gray-400 flex flex-wrap gap-2">
                  {openNote.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-gray-300"
                    >
                      #{tag}
                    </span>
                  ))}
                  {openNoteDueLabel && (
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
              <div
                className="note-content prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: sanitizedOpenContent }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteList;

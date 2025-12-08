/* eslint-disable react/prop-types */
import { format } from "date-fns";
import { 
  MapPinIcon as PinIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const NoteList = ({ notes, onEdit, onDelete, onPin, viewMode = "grid" }) => {
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

  const NoteCard = ({ note }) => {
    const dueDateLabel = formatDateValue(note.dueDate, "MMM d, h:mm a");
    const lastModifiedLabel = formatDateValue(
      note.lastModified || note.createdAt,
      "MMM d, h:mm a"
    );

    return (
      <div
        key={note.id}
        className={`group relative bg-white/80 dark:bg-slate-900/90 border border-slate-200/70 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0072F5]/15 ${
          note.isPinned ? "border-[#0072F5]" : ""
        }`}
      >
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: note.color || "#0072F5" }} />
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 line-clamp-2 flex-1">
              {note.title}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(note);
                }}
                className={`p-1 rounded-lg transition-colors ${
                  note.isPinned
                    ? "text-[#0072F5] hover:bg-[#0072F5]/10"
                    : "text-gray-500 hover:text-gray-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <PinIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
                className="p-1 text-gray-500 hover:text-red-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none mb-2">
            <div
              className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-300 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: note.content || "" }}
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
                  <span>{dueDateLabel}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              <span>{lastModifiedLabel || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`grid gap-3 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
      {notes.length === 0 && (
        <div className="col-span-full text-center py-8 text-xs text-gray-500">
          No notes found. Create your first note!
        </div>
      )}
    </div>
  );
};

export default NoteList;

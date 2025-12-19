/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */
import { MapPinIcon as PinIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import RichTextEditor from "./RichTextEditor";
import { sanitizeHtmlLinks } from "../utils/linkUtils";
import { hexToRgba, resolveTagColor } from "../utils/tagColors";

const NOTE_COLORS = [
  "#0072F5",
  "#5EA2EF",
  "#00C48C",
  "#F5A524",
  "#F31260",
  "#9353D3",
  "#1B2333",
  "#ffffff",
];

function HomeModal({
  noteToEdit,
  onCloseModal,
  showHomeModal,
  onSaveNote,
  existingTags: existingTagsProp = [],
  tagColors = {},
  onSetTagColor,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [tags, setTags] = useState([]);
  const [color, setColor] = useState("#ffffff");
  const [isPinned, setIsPinned] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newTagColor, setNewTagColor] = useState("#5EA2EF");
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const hasContent = (html) => {
    if (!html) return false;
    const text = html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.length > 0;
  };

  const formatDateTimeLocal = (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    const pad = (num) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const toDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (
      typeof value === "object" &&
      "seconds" in value &&
      "nanoseconds" in value
    ) {
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
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  useEffect(() => {
    setTagSuggestions((prev) => {
      const merged = new Set([...(existingTagsProp || []), ...(prev || [])]);
      return Array.from(merged);
    });
  }, [existingTagsProp]);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || "");
      setContent(noteToEdit.content || "");
      setDueDate(toDateValue(noteToEdit.dueDate));
      setTags(noteToEdit.tags || []);
      setColor(noteToEdit.color || "#ffffff");
      setIsPinned(noteToEdit.isPinned || false);
    } else {
      setTitle("");
      setContent("");
      setDueDate(null);
      setTags([]);
      setColor("#ffffff");
      setIsPinned(false);
    }
  }, [noteToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!hasContent(content)) {
      alert("Please add some note content before saving.");
      return;
    }

    try {
      const normalizedContent = sanitizeHtmlLinks(content);
      const noteDraft = {
        title: title.trim(),
        content: normalizedContent,
        dueDate,
        tags,
        color,
        isPinned,
      };

      if (typeof onSaveNote === "function") {
        await onSaveNote(noteDraft, noteToEdit);
      } else {
        throw new Error("Missing onSaveNote handler");
      }

      onCloseModal(false);
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note. Please try again.");
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag]);
      setTagSuggestions((prev) =>
        prev.includes(trimmedTag) ? prev : [...prev, trimmedTag]
      );
      if (typeof onSetTagColor === "function") {
        onSetTagColor(trimmedTag, newTagColor);
      }
      setNewTag("");
    }
  };

  const handleToggleTag = (tagToToggle) => {
    setTags((prevTags) =>
      prevTags.includes(tagToToggle)
        ? prevTags.filter((tag) => tag !== tagToToggle)
        : [...prevTags, tagToToggle]
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!showHomeModal) {
    return (
      <button
        onClick={() => onCloseModal(true)}
        className="flex items-center gap-2 h-10 px-4 bg-[#0072F5] hover:bg-[#0052CC] text-white text-xs font-medium rounded-lg transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        <span className="leading-none">New Note</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      {!showHomeModal ? (
        <button
          onClick={() => onCloseModal(true)}
          className="flex items-center gap-2 h-10 px-4 bg-[#0072F5] hover:bg-[#0052CC] text-white text-xs font-medium rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          <span className="leading-none">New Note</span>
        </button>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onCloseModal(false)} />
          <div className="relative bg-white dark:bg-[#1a1a1a] w-full max-w-2xl mx-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-slate-900 dark:text-gray-100">
                  {noteToEdit ? "Edit Note" : "Create New Note"}
                </h2>
                <button
                  onClick={() => onCloseModal(false)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full bg-white/80 dark:bg-[#2a2a2a] text-slate-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#0072F5] focus:ring-2 focus:ring-[#0072F5]/30 transition-colors"
                    required
                  />
                </div>

                <div className="bg-white/80 dark:bg-[#2a2a2a] rounded-lg border border-slate-200 dark:border-gray-700 p-2 shadow-inner">
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    className="min-h-[200px] text-sm text-slate-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map((tag) => {
                    const selected = tags.includes(tag);
                    const tagColor = resolveTagColor(tag, tagColors);
                    return (
                      <div key={tag} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          style={{
                            borderColor: tagColor,
                            backgroundColor: selected
                              ? tagColor
                              : hexToRgba(tagColor, 0.12),
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            selected
                              ? "text-white"
                              : "text-slate-700 dark:text-gray-200"
                          }`}
                        >
                          {tag}
                        </button>
                        <input
                          type="color"
                          value={tagColor}
                          onChange={(e) => onSetTagColor?.(tag, e.target.value)}
                          disabled={typeof onSetTagColor !== "function"}
                          className="h-8 w-8 cursor-pointer rounded-md border border-slate-200 dark:border-gray-700 bg-transparent p-0"
                          aria-label={`Color for tag ${tag}`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add tag"
                    className="flex-1 bg-white/80 dark:bg-[#2a2a2a] text-slate-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#0072F5] focus:ring-2 focus:ring-[#0072F5]/30 transition-colors"
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-md border border-slate-200 dark:border-gray-700 bg-transparent p-0"
                    aria-label="New tag color"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-white/80 hover:bg-white dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a] text-slate-800 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors border border-slate-200 dark:border-gray-700"
                  >
                    Add Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-slate-500 dark:text-gray-400 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={formatDateTimeLocal(dueDate)}
                    onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
                    className="w-full bg-white/80 dark:bg-[#2a2a2a] text-slate-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#0072F5] focus:ring-2 focus:ring-[#0072F5]/30 transition-colors"
                  />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDueDate(new Date())}
                    className="px-3 py-2 text-xs bg-white/80 dark:bg-[#2a2a2a] border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-[#3a3a3a] transition-colors text-slate-800 dark:text-gray-200"
                  >
                    Set to current time
                  </button>
                  <button
                    type="button"
                    onClick={() => setDueDate(null)}
                    className="px-3 py-2 text-xs bg-white/60 dark:bg-[#1f1f1f] border border-slate-200 dark:border-gray-800 rounded-lg hover:bg-white/80 dark:hover:bg-[#2a2a2a] transition-colors text-slate-700 dark:text-gray-300"
                  >
                    Clear date
                  </button>
                </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-500 dark:text-gray-400 mb-2">
                    Note color
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {NOTE_COLORS.map((swatch) => {
                      const active =
                        typeof color === "string" &&
                        color.toLowerCase() === swatch.toLowerCase();

                      return (
                        <button
                          key={swatch}
                          type="button"
                          onClick={() => setColor(swatch)}
                          className={`h-8 w-8 rounded-full border border-slate-200 dark:border-gray-700 transition-transform ${
                            active
                              ? "ring-2 ring-[#0072F5] scale-[1.05]"
                              : "hover:scale-[1.05]"
                          }`}
                          style={{ backgroundColor: swatch }}
                          aria-label={`Set note color to ${swatch}`}
                        />
                      );
                    })}
                    <div className="flex items-center gap-2 pl-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-9 w-9 cursor-pointer rounded-md border border-slate-200 dark:border-gray-700 bg-transparent p-0"
                        aria-label="Custom note color"
                      />
                      <span className="text-xs text-slate-500 dark:text-gray-400">
                        {color?.toUpperCase?.() || ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPinned(!isPinned)}
                      className={`p-2 rounded-lg transition-colors ${
                        isPinned
                          ? "bg-[#0072F5] text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:text-gray-400 dark:hover:bg-[#3a3a3a]"
                      }`}
                    >
                      <PinIcon className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400">
                      {isPinned ? "Pinned" : "Pin Note"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onCloseModal(false)}
                      className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0072F5] hover:bg-[#0052CC] text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-[#0072F5]/25"
                    >
                      {noteToEdit ? "Save Changes" : "Add Note"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeModal;

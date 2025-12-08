/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */
import { MapPinIcon as PinIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import RichTextEditor from "./RichTextEditor";


function HomeModal({
  noteToEdit,
  onCloseModal,
  showHomeModal,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [tags, setTags] = useState([]);
  const [color, setColor] = useState("#ffffff");
  const [isPinned, setIsPinned] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [existingTags, setExistingTags] = useState([]);

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

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || "");
      setContent(noteToEdit.content || "");
      setDueDate(noteToEdit.dueDate ? noteToEdit.dueDate.toDate() : null);
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

  // Fetch existing tags
  useEffect(() => {
    const fetchTags = async () => {
      if (!auth.currentUser) {
        setExistingTags([]);
        return;
      }
      const notesRef = collection(db, "notes");
      const q = query(notesRef, where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const allTags = new Set();
      querySnapshot.forEach((doc) => {
        const noteTags = doc.data().tags || [];
        noteTags.forEach(tag => allTags.add(tag));
      });
      setExistingTags(Array.from(allTags));
    };
    fetchTags();
  }, [auth.currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      const noteData = {
        title: title.trim(),
        content,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags,
        color,
        isPinned,
        userId: auth.currentUser.uid,
        lastModified: serverTimestamp(),
      };

      if (noteToEdit) {
        await updateDoc(doc(db, "notes", noteToEdit.id), noteData);
      } else {
        noteData.createdAt = serverTimestamp();
        await addDoc(collection(db, "notes"), noteData);
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
      setExistingTags((prev) =>
        prev.includes(trimmedTag) ? prev : [...prev, trimmedTag]
      );
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
        className="flex items-center gap-2 px-4 py-2 bg-[#0072F5] hover:bg-[#0052CC] text-white text-xs font-medium rounded-lg transition-colors"
      >
        <span className="text-lg">+</span>
        <span>New Note</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      {!showHomeModal ? (
        <button
          onClick={() => onCloseModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0072F5] hover:bg-[#0052CC] text-white text-xs font-medium rounded-lg transition-colors"
        >
          <span className="text-lg">+</span>
          <span>New Note</span>
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
                  {existingTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        tags.includes(tag)
                          ? "bg-[#0072F5] text-white"
                          : "bg-white/80 text-slate-700 border border-slate-200 hover:bg-white dark:bg-[#2a2a2a] dark:text-gray-300 dark:border-gray-700 dark:hover:bg-[#3a3a3a]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
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

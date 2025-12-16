const NOTES_STORAGE_VERSION = 1;

const storageAvailable = () => {
  try {
    const key = "__lifelog_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const getNotesKey = (userId) => `lifelog_notes_v${NOTES_STORAGE_VERSION}_${userId}`;

export const generateLocalNoteId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

export const loadLocalNotes = (userId) => {
  if (!userId || !storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(getNotesKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load local notes", error);
    return [];
  }
};

export const saveLocalNotes = (userId, notes) => {
  if (!userId || !storageAvailable()) return;
  try {
    window.localStorage.setItem(getNotesKey(userId), JSON.stringify(notes));
  } catch (error) {
    console.error("Failed to save local notes", error);
  }
};

export const upsertLocalNote = (userId, note) => {
  const notes = loadLocalNotes(userId);
  const index = notes.findIndex((item) => item?.id === note?.id);
  const next = index >= 0 ? [...notes] : [...notes, note];
  if (index >= 0) next[index] = note;
  saveLocalNotes(userId, next);
  return next;
};

export const deleteLocalNote = (userId, noteId) => {
  const notes = loadLocalNotes(userId);
  const next = notes.filter((note) => note?.id !== noteId);
  saveLocalNotes(userId, next);
  return next;
};


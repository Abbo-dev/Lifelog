const HISTORY_STORAGE_VERSION = 1;
const DEFAULT_HISTORY_LIMIT = 20;

const storageAvailable = () => {
  try {
    const key = "__lifelog_history_test__";
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

const getHistoryKey = (userId, noteId) =>
  `lifelog_note_history_v${HISTORY_STORAGE_VERSION}_${userId}_${noteId}`;

const normalizeSnapshot = (note) => ({
  title: note?.title || "",
  content: note?.content || "",
  tags: Array.isArray(note?.tags) ? note.tags : [],
  dueDate: note?.dueDate || null,
  color: note?.color || "#ffffff",
  isPinned: !!note?.isPinned,
});

const snapshotsEqual = (a, b) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

export const loadNoteHistory = (userId, noteId) => {
  if (!userId || !noteId || !storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(getHistoryKey(userId, noteId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load note history", error);
    return [];
  }
};

export const saveNoteVersion = (
  userId,
  note,
  { limit = DEFAULT_HISTORY_LIMIT } = {}
) => {
  if (!userId || !note?.id || !storageAvailable()) return [];

  const snapshot = normalizeSnapshot(note);
  const history = loadNoteHistory(userId, note.id);
  const lastSnapshot = history[0]?.snapshot || null;
  if (lastSnapshot && snapshotsEqual(lastSnapshot, snapshot)) return history;

  const entry = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    savedAt: new Date().toISOString(),
    snapshot,
  };

  const next = [entry, ...history].slice(0, limit);
  try {
    window.localStorage.setItem(
      getHistoryKey(userId, note.id),
      JSON.stringify(next)
    );
  } catch (error) {
    console.error("Failed to save note history", error);
  }
  return next;
};

export const deleteNoteHistory = (userId, noteId) => {
  if (!userId || !noteId || !storageAvailable()) return;
  try {
    window.localStorage.removeItem(getHistoryKey(userId, noteId));
  } catch (error) {
    console.error("Failed to delete note history", error);
  }
};

export const getHistoryLimit = () => DEFAULT_HISTORY_LIMIT;

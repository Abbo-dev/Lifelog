import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const CLOUD_HISTORY_LIMIT = 30;

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

/**
 * Save a version snapshot to the cloud (Firestore subcollection).
 * Returns true on success.
 */
export const saveCloudNoteVersion = async (noteId, note, { lastCloudSnapshot } = {}) => {
  if (!noteId || !note) return false;

  const snapshot = normalizeSnapshot(note);

  if (lastCloudSnapshot && snapshotsEqual(lastCloudSnapshot, snapshot)) {
    return false;
  }

  try {
    const versionsRef = collection(db, "notes", noteId, "versions");
    await addDoc(versionsRef, {
      snapshot,
      savedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Failed to save cloud note version", error);
    return false;
  }
};

/**
 * Load version history from the cloud (Firestore subcollection).
 * Returns an array of { id, savedAt, snapshot } objects, newest first.
 */
export const loadCloudNoteHistory = async (noteId) => {
  if (!noteId) return [];

  try {
    const versionsRef = collection(db, "notes", noteId, "versions");
    const q = query(versionsRef, orderBy("savedAt", "desc"), limit(CLOUD_HISTORY_LIMIT));
    const snap = await getDocs(q);

    return snap.docs.map((doc) => {
      const data = doc.data();
      const savedAt = data.savedAt?.toDate?.()?.toISOString?.() || new Date().toISOString();
      return {
        id: doc.id,
        savedAt,
        snapshot: data.snapshot || {},
      };
    });
  } catch (error) {
    console.error("Failed to load cloud note history", error);
    return [];
  }
};

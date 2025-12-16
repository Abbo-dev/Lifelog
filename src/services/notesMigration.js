import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { loadLocalNotes } from "../utils/localNotes";

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
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
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const importLocalNotesToCloud = async (userId) => {
  if (!userId) throw new Error("Missing userId");

  const localNotes = loadLocalNotes(userId).filter((note) => !!note?.id);
  if (localNotes.length === 0) return { imported: 0 };

  let imported = 0;
  for (const note of localNotes) {
    const createdAt = toDateValue(note.createdAt);
    const lastModified = toDateValue(note.lastModified);
    const dueDate = toDateValue(note.dueDate);

    await setDoc(doc(db, "notes", note.id), {
      title: note.title || "",
      content: note.content || "",
      dueDate: dueDate || null,
      tags: Array.isArray(note.tags) ? note.tags : [],
      color: note.color || "#ffffff",
      isPinned: !!note.isPinned,
      userId,
      createdAt: createdAt || serverTimestamp(),
      lastModified: lastModified || serverTimestamp(),
    });
    imported += 1;
  }

  return { imported };
};


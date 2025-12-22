import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Skeleton } from "@heroui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeHtmlForPublicShare } from "../utils/sanitizeSharedHtml";

const toDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
    return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000));
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

function ShareNote() {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!shareId) return;
    setStatus("loading");

    const ref = doc(db, "publicNotes", shareId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setNote(null);
          setStatus("not_found");
          return;
        }
        setNote({ id: snap.id, ...snap.data() });
        setStatus("ready");
      },
      (error) => {
        console.error("Failed to load shared note", error);
        setStatus("error");
      }
    );

    return () => unsub();
  }, [shareId]);

  const sanitizedContent = useMemo(
    () => sanitizeHtmlForPublicShare(note?.content || ""),
    [note?.content]
  );

  const lastModified = useMemo(() => toDateValue(note?.lastModified), [note?.lastModified]);
  const lastModifiedLabel = lastModified
    ? lastModified.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <main className="relative w-full px-4 md:px-6 pb-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#0072F5]/15 to-[#5EA2EF]/10 blur-3xl" />
        <div className="absolute -bottom-32 right-[-120px] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#00C48C]/10 to-[#0072F5]/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-3 py-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-gray-100 transition-colors">
              LifeLog
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-gray-200">Shared note</span>
          </div>
          <Link
            to="/auth?mode=signin"
            className="px-3 py-1.5 text-xs rounded-lg border border-[#0072F5]/30 text-[#0052CC] dark:text-[#5EA2EF] hover:bg-[#0072F5]/10 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {status === "loading" ? (
          <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6 space-y-3">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ) : status === "not_found" ? (
          <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
              This shared note isn&apos;t available
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
              The link may be expired or the note was unshared.
            </p>
            <div className="mt-4">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg bg-[#0072F5] hover:bg-[#0052CC] text-white transition-colors"
              >
                Go to LifeLog
              </Link>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-6">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
              Couldn&apos;t load this note
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
              Please try again in a moment.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-gray-800">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">
                {note?.title || "Untitled note"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-gray-400">
                {Array.isArray(note?.tags) && note.tags.length > 0 ? (
                  note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-gray-700 bg-white/60 dark:bg-white/5 text-slate-600 dark:text-gray-200"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 dark:text-gray-500">No tags</span>
                )}
                {lastModifiedLabel ? (
                  <span className="ml-auto">Updated {lastModifiedLabel}</span>
                ) : null}
              </div>
            </div>

            <div className="p-6">
              <div
                className="note-content prose prose-sm md:prose-base dark:prose-invert max-w-none text-slate-800 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ShareNote;

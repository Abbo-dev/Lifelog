import HomeModal from "./HomeModal";
import ReactConfetti from "react-confetti";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import Search from "../assets/search.svg";
import NoteList from "./NoteList";
import {
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [notes, setNotes] = useState([]);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [sortBy, setSortBy] = useState("lastModified");
  const [filterTag, setFilterTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isTagDropActive, setIsTagDropActive] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const sortOptions = [
    { value: "lastModified", label: "Last Modified" },
    { value: "createdAt", label: "Created Date" },
    { value: "title", label: "Title" },
    { value: "dueDate", label: "Due Date" },
  ];

  const handleCloseModal = (open) => {
    setShowHomeModal(open);
    if (!open) {
      setNoteToEdit(null);
    }
  };

  const handleEdit = async (note) => {
    setNoteToEdit(note);
    setShowHomeModal(true);
  };

  const handleDelete = async (note) => {
    try {
      await deleteDoc(doc(db, "notes", note.id));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const docRef = collection(db, "notes");
    const q = query(docRef, where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesData);
      setNotesLoaded(true);
    });
    return unsubscribe;
  }, [auth.currentUser]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setShowCard(true);
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        setConfetti(true);
        setTimeout(() => {
          setConfetti(false);
        }, 4000);
      } else {
        setIsAuthenticated(false);
        setShowCard(true);
        setNotes([]);
        setNotesLoaded(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignIn = () => {
    navigate("/signin");
    setShowCard(false);
  };

  const handleSignUp = () => {
    navigate("/signup");
    setShowCard(false);
  };

  const handlePin = async (note) => {
    try {
      await updateDoc(doc(db, "notes", note.id), {
        isPinned: !note.isPinned,
        lastModified: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error pinning note:", error);
    }
  };

  const normalizeText = (value) => (value || "").toLowerCase();

  const handleTagDragStart = (tag) => (event) => {
    event.dataTransfer.setData("text/plain", tag);
    event.dataTransfer.effectAllowed = "copy";
  };

  const handleTagDrop = (event) => {
    event.preventDefault();
    const draggedTag = event.dataTransfer.getData("text/plain");
    if (draggedTag) {
      setFilterTag(draggedTag);
    }
    setIsTagDropActive(false);
  };

  const handleTagDragOver = (event) => {
    event.preventDefault();
    setIsTagDropActive(true);
  };

  const handleTagDragLeave = () => setIsTagDropActive(false);

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
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value.toDate === "function") {
      try {
        return value.toDate();
      } catch (err) {
        console.error("Failed to convert date", err);
        return null;
      }
    }
    return null;
  };

  const formatDue = (note) => {
    const due = toDateValue(note.dueDate);
    return due ? format(due, "EEE, MMM d • h:mma") : "No due date";
  };

  const pinnedNotes = useMemo(
    () => notes.filter((note) => note.isPinned).slice(0, 4),
    [notes]
  );

  const upcomingNotes = useMemo(() => {
    const now = new Date();
    const soon = addDays(now, 14);
    return notes
      .filter((note) => {
        const due = toDateValue(note.dueDate);
        return due && due >= now && due <= soon;
      })
      .sort((a, b) => {
        const aTime =
          toDateValue(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
        const bTime =
          toDateValue(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 5);
  }, [notes]);

  const priorityNotes = useMemo(() => {
    const map = new Map();
    pinnedNotes.forEach((note) => map.set(note.id, note));
    upcomingNotes.forEach((note) => {
      if (!map.has(note.id)) {
        map.set(note.id, note);
      }
    });
    return Array.from(map.values()).slice(0, 6);
  }, [pinnedNotes, upcomingNotes]);

  const dashboardStats = useMemo(() => {
    const total = notes.length;
    const pinned = pinnedNotes.length;
    const upcoming = upcomingNotes.length;
    const dated = notes.filter((note) => !!toDateValue(note.dueDate)).length;
    return { total, pinned, upcoming, dated };
  }, [notes, pinnedNotes, upcomingNotes]);
  const nextDue = upcomingNotes[0];

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = [...notes];

    if (searchQuery) {
      const queryText = searchQuery.toLowerCase();
      filtered = filtered.filter((note) => {
        const tags = Array.isArray(note.tags) ? note.tags : [];
        return (
          normalizeText(note.title).includes(queryText) ||
          normalizeText(note.content).includes(queryText) ||
          tags.some((tag) => normalizeText(tag).includes(queryText))
        );
      });
    }

    if (filterTag) {
      filtered = filtered.filter(
        (note) => note.tags && note.tags.includes(filterTag)
      );
    }

    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return b.isPinned ? 1 : -1;
      }

      switch (sortBy) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "createdAt": {
          const createdA = toDateValue(a.createdAt)?.getTime() || 0;
          const createdB = toDateValue(b.createdAt)?.getTime() || 0;
          return createdB - createdA;
        }
        case "dueDate": {
          const dueA = toDateValue(a.dueDate);
          const dueB = toDateValue(b.dueDate);
          if (!dueA && !dueB) return 0;
          if (!dueA) return 1;
          if (!dueB) return -1;
          return dueA.getTime() - dueB.getTime();
        }
        case "lastModified":
        default: {
          const lastA = toDateValue(a.lastModified)?.getTime() || 0;
          const lastB = toDateValue(b.lastModified)?.getTime() || 0;
          return lastB - lastA;
        }
      }
    });

    return filtered;
  }, [notes, searchQuery, filterTag, sortBy]);

  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach((note) => {
      if (note.tags) {
        note.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [notes]);

  if (loading) {
    return (
      <div className="flex justify-center items-center z-50 fixed top-0 left-0 w-full h-full backdrop-blur-md bg-background">
        <div className="w-full h-full flex justify-center items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-500 dark:border-gray-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden text-slate-900 dark:text-gray-100"
      style={{ background: "var(--app-bg)" }}
    >
      {confetti && (
        <div className="fixed inset-0 z-30 overflow-hidden">
          <ReactConfetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.2}
          />
        </div>
      )}

      {!isAuthenticated && showCard && (
        <div className="flex justify-center items-center z-40 fixed top-0 left-0 w-full h-full backdrop-blur-sm bg-black/50">
          <div className="w-full max-w-[400px] m-5 p-6 bg-white/90 dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="text-center mb-6">
              <p className="text-sm text-slate-700 dark:text-gray-300">
                In order to use LifeLog, you need to sign in or sign up.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-[#0072F5] hover:bg-[#0052CC] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-[#2a2a2a] dark:hover:bg-[#3a3a3a] dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex flex-col items-center justify-around mt-2 md:mt-4 pt-6 max-w-[1200px] mx-auto px-4 pb-14">
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col gap-4 mb-6"
          >
            <div className="flex items-center justify-between gap-3 text-xs text-slate-700 dark:text-gray-300">
              <span className="uppercase tracking-[0.2em] pb-2">
                Snapshot {showSnapshot ? "visible" : "hidden"}
              </span>
              <Button
                size="sm"
                variant="flat"
                className="border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-[#2a2a2a] text-slate-800 dark:text-gray-200 hover:-translate-y-0.5 transition-all shadow-sm"
                onPress={() => setShowSnapshot((prev) => !prev)}
              >
                {showSnapshot ? "Hide snapshot" : "Show snapshot"}
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-shrink-0">
                <HomeModal
                  className="z-20"
                  noteToEdit={noteToEdit}
                  showHomeModal={showHomeModal}
                  onCloseModal={handleCloseModal}
                />
              </div>

              <div className="flex-1 max-w-[600px]">
                <Input
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Search notes... 🔍"
                  startContent={
                    <img
                      src={Search}
                      alt="search"
                      className="w-4 h-4 opacity-60"
                    />
                  }
                  endContent={
                    searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-gray-400 hover:text-gray-300 text-xs"
                      >
                        ✕
                      </button>
                    ) : null
                  }
                  className="w-full"
                  classNames={{
                    inputWrapper:
                      "bg-white/80 dark:bg-[#2a2a2a] border border-slate-200 dark:border-gray-700 shadow-sm",
                    input: "text-slate-800 dark:text-gray-300",
                  }}
                  size="sm"
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Select
                  selectedKeys={[sortBy]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0];
                    if (value) setSortBy(value.toString());
                  }}
                  size="sm"
                  className="min-w-[150px]"
                  classNames={{
                    trigger:
                      "bg-white/80 dark:bg-[#2a2a2a] text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-gray-700 shadow-sm text-xs",
                  }}
                  aria-label="Sort notes"
                >
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  selectedKeys={filterTag ? [filterTag] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0];
                    setFilterTag(value ? value.toString() : "");
                  }}
                  allowEmptySelection
                  placeholder="All tags"
                  size="sm"
                  className="min-w-[140px]"
                  classNames={{
                    trigger:
                      "bg-white/80 dark:bg-[#2a2a2a] text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-gray-700 shadow-sm text-xs",
                  }}
                  aria-label="Filter by tag"
                >
                  <SelectItem key="" value="">
                    All tags
                  </SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </Select>

                <Button
                  size="sm"
                  variant="flat"
                  className="bg-white/80 dark:bg-[#2a2a2a] text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-gray-700 shadow-sm"
                  onPress={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                >
                  {viewMode === "grid" ? "List" : "Grid"}
                </Button>
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                    Drag a tag ➜
                  </span>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      draggable
                      onDragStart={handleTagDragStart(tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/80 dark:bg-[#2a2a2a] border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 shadow-sm hover:-translate-y-0.5 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div
                  onDrop={handleTagDrop}
                  onDragOver={handleTagDragOver}
                  onDragLeave={handleTagDragLeave}
                  className={`w-full lg:w-72 rounded-lg border-2 text-xs px-4 py-3 transition-all shadow-sm ${
                    isTagDropActive
                      ? "border-[#0072F5] bg-[#0072F5]/10 text-[#0072F5]"
                      : "border-dashed border-slate-300 dark:border-gray-700 bg-white/60 dark:bg-[#111827] text-slate-500 dark:text-gray-400"
                  }`}
                >
                  {filterTag
                    ? `Filtering by #${filterTag} ✨`
                    : "Drop a tag here to filter 🔖"}
                </div>
              </div>
            )}

            {showSnapshot && (
              <div className="w-full flex flex-col gap-4">
                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="hidden md:block glass-panel-soft rounded-3xl p-5 lg:p-6 text-white border border-white/10 shadow-2xl shadow-black/30 overflow-hidden w-full"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap pb-3 border-b border-white/10">
                    <div className="space-y-1">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                        Snapshot summary
                      </p>
                      <h2 className="text-lg font-semibold">
                        Stay on track at a glance
                      </h2>
                      <p className="text-xs text-white/70">
                        Full dashboard snapshot lives here on desktop.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        className="px-3 py-2 text-[12px] rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15 transition-colors"
                        onPress={() => navigate("/profile")}
                      >
                        View full snapshot
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    {[
                      { label: "Total", value: dashboardStats.total },
                      { label: "Pinned", value: dashboardStats.pinned },
                      { label: "Upcoming", value: dashboardStats.upcoming },
                      { label: "With dates", value: dashboardStats.dated },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="glass-panel-soft rounded-xl p-3 border border-white/10 text-left"
                      >
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                          {stat.label}
                        </p>
                        <p className="text-xl font-semibold text-white mt-1">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                          Priority notes
                        </p>
                        <span className="text-[11px] text-white/70">
                          {priorityNotes.length
                            ? `${priorityNotes.length} active`
                            : "None yet"}
                        </span>
                      </div>
                      <div className="mt-3 space-y-3">
                        {priorityNotes.length === 0 ? (
                          <p className="text-sm text-white/60">
                            Pin or set due dates to see them here.
                          </p>
                        ) : (
                          priorityNotes.slice(0, 2).map((note) => (
                            <div
                              key={note.id}
                              className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                            >
                              <div className="space-y-0.5 text-left">
                                <p className="text-sm font-semibold text-white line-clamp-1">
                                  {note.title || "Untitled note"}
                                </p>
                                <p className="text-[11px] text-white/70">
                                  {note.isPinned ? "Pinned • " : ""}
                                  {formatDue(note)}
                                </p>
                              </div>
                            <Button
                              size="sm"
                              variant="flat"
                              className="text-[11px] px-2.5 py-1 rounded-full border border-white/15 bg-[#5EA2EF]/20 text-white hover:bg-[#5EA2EF]/30 transition-colors"
                              onPress={() => handleEdit(note)}
                            >
                              Open
                            </Button>
                          </div>
                        ))
                      )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                          Next due
                        </p>
                        <span className="text-[11px] text-white/70">
                          {nextDue ? "Within 2 weeks" : "No upcoming"}
                        </span>
                      </div>
                      {nextDue ? (
                        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
                          <p className="text-sm font-semibold text-white line-clamp-1">
                            {nextDue.title || "Untitled note"}
                          </p>
                          <p className="text-[11px] text-white/70 mt-1">
                            {formatDue(nextDue)}
                          </p>
                          {nextDue.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {nextDue.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[11px] border border-white/15 bg-white/5 text-white/80"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-white/60 mt-2">
                          Add a due date to see it here.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="lg:hidden glass-panel-soft rounded-2xl p-4 text-white border border-white/10 shadow-2xl shadow-black/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                        Snapshot
                      </p>
                      <p className="text-sm text-white/80">Quick glance</p>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      className="px-3 py-1.5 text-[12px] rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15 transition-colors"
                      onPress={() => navigate("/profile")}
                    >
                      Open profile
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                      { label: "Total", value: dashboardStats.total },
                      { label: "Pinned", value: dashboardStats.pinned },
                      { label: "Upcoming", value: dashboardStats.upcoming },
                      { label: "With dates", value: dashboardStats.dated },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left"
                      >
                        <p className="text-[11px] uppercase tracking-wide text-white/60">
                          {stat.label}
                        </p>
                        <p className="text-base font-semibold text-white">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/65 mt-3">
                    Full bars and reminders show on larger screens.
                  </p>
                </motion.section>
              </div>
            )}
          </motion.div>
        )}

        {notesLoaded && notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center w-full py-16"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[#5EA2EF]/30 to-[#0072F5]/20 rounded-full -z-10" />
              <div className="absolute -top-6 -right-8 w-12 h-12 rounded-full bg-white/30 dark:bg-white/10 blur-2xl animate-pulse" />
            </div>

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="text-center space-y-3"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-chip border border-white/20 shadow-[0_15px_40px_rgba(0,114,245,0.25)]">
                <span className="text-xs uppercase tracking-[0.25em] text-slate-700 dark:text-gray-200">
                  Welcome aboard
                </span>
                <span className="text-lg">🎉</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-gray-100">
                A calm space just for you
              </h1>
              <p className="text-lg md:text-xl bg-gradient-to-b from-[#5EA2EF] to-[#0072F5] bg-clip-text text-transparent font-semibold">
                {auth.currentUser?.displayName
                  ? auth.currentUser.displayName
                  : "New lifelogger"}
              </p>
              <p className="text-sm text-slate-600 dark:text-gray-300 max-w-md mx-auto">
                Create your first note to pin milestones, add reminders, and keep your flow streak going.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
                className="flex items-center justify-center gap-3 pt-2"
              >
                <div className="h-2 w-2 rounded-full bg-[#5EA2EF] animate-pulse" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-gray-300">
                  Start by creating your first note
                </p>
                <div className="h-2 w-2 rounded-full bg-[#0072F5] animate-pulse" />
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <div
            className={`w-full ${viewMode === "list" ? "max-w-[900px]" : ""}`}
          >
            <NoteList
              notes={filteredAndSortedNotes}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              viewMode={viewMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

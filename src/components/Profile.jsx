import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardBody } from "@heroui/card";
import { Button, Avatar, Chip } from "@heroui/react";
import { auth, db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { loadLocalNotes } from "../utils/localNotes";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

const statCards = [
  { label: "Notes", key: "notes" },
  { label: "Pinned", key: "pinned" },
  { label: "Tags", key: "tags" },
  { label: "Daily streak", key: "streak" },
];

const AVATAR_MAX_DIMENSION = 512;
const AVATAR_OUTPUT_QUALITY = 0.82;
const AVATAR_OUTPUT_MIME_TYPE = "image/webp";

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to process image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });

const loadImageSource = async (file) => {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load the image."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const prepareAvatarBlob = async (file) => {
  const source = await loadImageSource(file);
  const sourceWidth =
    "naturalWidth" in source ? source.naturalWidth : source.width || 0;
  const sourceHeight =
    "naturalHeight" in source ? source.naturalHeight : source.height || 0;

  if (!sourceWidth || !sourceHeight) {
    if (typeof source.close === "function") source.close();
    throw new Error("Unable to read image dimensions.");
  }

  const scale = Math.min(
    1,
    AVATAR_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight)
  );
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    if (typeof source.close === "function") source.close();
    throw new Error("Unable to create canvas context.");
  }

  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  if (typeof source.close === "function") source.close();

  let blob = await canvasToBlob(
    canvas,
    AVATAR_OUTPUT_MIME_TYPE,
    AVATAR_OUTPUT_QUALITY
  );

  if (blob.type === "image/png" && file.type !== "image/png") {
    blob = await canvasToBlob(canvas, "image/jpeg", AVATAR_OUTPUT_QUALITY);
  }

  return blob;
};

function Profile() {
  const navigate = useNavigate();
  const { user, isPremium, planLoading } = useAuth();
  const [stats, setStats] = useState({
    notes: 0,
    pinned: 0,
    tags: 0,
    streak: 0,
  });
  const [newEmail, setNewEmail] = useState(() => auth.currentUser?.email || "");
  const [authPassword, setAuthPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notes, setNotes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState("");
  const avatarInputRef = useRef(null);

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
    if (typeof value.toDate === "function") {
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

  const formatDayKey = (date) => {
    const d = toDateValue(date);
    if (!d) return null;
    const pad = (num) => String(num).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const calculateStreak = (daySet) => {
    let streak = 0;
    const today = new Date();
    const cursor = new Date(today);
    const pad = (num) => String(num).padStart(2, "0");
    const formatCursor = (dt) =>
      `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

    while (daySet.has(formatCursor(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };

  useEffect(() => {
    if (!user?.uid) {
      setNotes([]);
      return undefined;
    }
    if (planLoading) return undefined;

    if (!isPremium) {
      setNotes(loadLocalNotes(user.uid));
      return undefined;
    }

    const notesRef = collection(db, "notes");
    const q = query(notesRef, where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noteData = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setNotes(noteData);
    });
    return unsubscribe;
  }, [user?.uid, isPremium, planLoading]);

  useEffect(() => {
    const tagSet = new Set();
    let pinnedCount = 0;
    const activityDays = new Set();

    notes.forEach((note) => {
      if (note?.isPinned) pinnedCount += 1;
      (note?.tags || []).forEach((tag) => tagSet.add(tag));
      const createdKey = formatDayKey(note?.createdAt || note?.lastModified);
      const editedKey = formatDayKey(note?.lastModified);
      if (createdKey) activityDays.add(createdKey);
      if (editedKey) activityDays.add(editedKey);
    });

    setStats({
      notes: notes.length,
      pinned: pinnedCount,
      tags: tagSet.size,
      streak: calculateStreak(activityDays),
    });
  }, [notes]);

  useEffect(() => {
    setNewEmail(user?.email || "");
  }, [user]);

  const reauthenticate = async (password) => {
    if (!user?.email) {
      throw new Error("Email is required to reauthenticate.");
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailStatus("");
    if (!user) {
      setEmailStatus("Please sign in again to update your email.");
      return;
    }
    if (!newEmail.trim()) {
      setEmailStatus("Enter a valid email.");
      return;
    }
    if (!authPassword) {
      setEmailStatus("Enter your password to confirm.");
      return;
    }
    try {
      setSavingEmail(true);
      await reauthenticate(authPassword);
      await updateEmail(user, newEmail.trim());
      setEmailStatus("Email updated successfully.");
      setAuthPassword("");
    } catch (error) {
      setEmailStatus(error?.message || "Unable to update email.");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus("");

    if (!user) {
      setPasswordStatus("Please sign in again to update your password.");
      return;
    }

    if (!passwordForm.current) {
      setPasswordStatus("Enter your current password.");
      return;
    }

    if (!passwordForm.next || passwordForm.next.length < 6) {
      setPasswordStatus("New password should be at least 6 characters.");
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordStatus("New passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      await reauthenticate(passwordForm.current);
      await updatePassword(user, passwordForm.next);
      setPasswordStatus("Password updated successfully.");
      setPasswordForm({ current: "", next: "", confirm: "" });
    } catch (error) {
      setPasswordStatus(error?.message || "Unable to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!user) {
      setAvatarStatus("Sign in again to update your photo.");
      return;
    }
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarStatus("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAvatarStatus("Image must be under 10MB.");
      return;
    }
    try {
      setAvatarUploading(true);
      setAvatarStatus("Optimizing...");
      const optimizedBlob = await prepareAvatarBlob(file);

      setAvatarStatus("Uploading...");
      const storageRef = ref(storage, `avatars/${user.uid}/avatar`);
      await uploadBytes(storageRef, optimizedBlob, {
        contentType: optimizedBlob.type || file.type,
      });
      const url = await getDownloadURL(storageRef);
      const cacheBustedUrl = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      await updateProfile(user, { photoURL: cacheBustedUrl });
      setAvatarStatus("Photo updated.");
    } catch (error) {
      setAvatarStatus(error?.message || "Unable to update photo.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const formatDue = (note) => {
    const due = toDateValue(note?.dueDate);
    return due ? format(due, "EEE, MMM d • h:mma") : "No due date";
  };

  const pinnedNotes = useMemo(
    () => notes.filter((note) => note.isPinned).slice(0, 6),
    [notes]
  );

  const upcomingNotes = useMemo(() => {
    const now = new Date();
    const soon = addDays(now, 21);
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
      });
  }, [notes]);

  const priorityNotes = useMemo(() => {
    const map = new Map();
    pinnedNotes.forEach((note) => map.set(note.id, note));
    upcomingNotes.forEach((note) => {
      if (!map.has(note.id)) {
        map.set(note.id, note);
      }
    });
    return Array.from(map.values()).slice(0, 8);
  }, [pinnedNotes, upcomingNotes]);

  const dashboardStats = useMemo(() => {
    const total = notes.length;
    const pinned = pinnedNotes.length;
    const upcoming = upcomingNotes.length;
    const dated = notes.filter((note) => !!toDateValue(note.dueDate)).length;
    return { total, pinned, upcoming, dated };
  }, [notes, pinnedNotes, upcomingNotes]);

  const notesByDate = useMemo(() => {
    const map = {};
    notes.forEach((note) => {
      const due = toDateValue(note.dueDate);
      if (!due) return;
      const key = format(due, "yyyy-MM-dd");
      map[key] = map[key] || [];
      map[key].push(note);
    });
    Object.values(map).forEach((list) =>
      list.sort(
        (a, b) =>
          (toDateValue(a.dueDate)?.getTime() || 0) -
          (toDateValue(b.dueDate)?.getTime() || 0)
      )
    );
    return map;
  }, [notes]);

  const selectedDateNotes = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return notesByDate[key] || [];
  }, [notesByDate, selectedDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 });
    const days = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [calendarMonth]);

  const handleMonthChange = (direction) => {
    setCalendarMonth(addMonths(calendarMonth, direction));
  };

  const handleDateSelect = (day) => {
    setSelectedDate(day);
    setCalendarMonth(day);
  };

  if (!user) {
    return (
      <div className="profile-shell relative overflow-hidden flex flex-col items-center justify-center min-h-screen gap-4 text-center text-slate-900 dark:text-gray-100">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <p className="text-lg text-slate-700 dark:text-gray-200">
            Please sign in to view your profile.
          </p>
          <Button onPress={() => navigate("/signin")}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-shell relative min-h-screen overflow-hidden text-slate-900 dark:text-gray-100">
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
              Profile
            </p>
            <h1 className="text-3xl font-bold mt-2 flex items-center gap-2">
              Hello, {user.displayName || "Explorer"}{" "}
              <span className="text-2xl">👋</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              {user.email}
            </p>
          </div>
          <div className="relative">
            <Avatar
              className="w-16 h-16 text-xl ring-4 ring-[#0072F5]/20"
              src={user.photoURL}
              name={user.displayName?.[0]?.toUpperCase() || "U"}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-[#0072F5] text-white flex items-center justify-center text-sm shadow-lg shadow-[#0072F5]/40 border border-white/30 hover:scale-105 transition"
              aria-label="Upload profile photo"
              disabled={avatarUploading}
            >
              ✎
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>
        {avatarStatus && (
          <div className="mb-6 text-xs text-slate-600 dark:text-gray-300">
            {avatarStatus}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((item) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: statCards.indexOf(item) * 0.08 }}
            >
              <Card className="profile-card">
                <CardBody className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">
                    {item.label}
                  </p>
                  <p className="text-3xl font-semibold mt-2">
                    {stats[item.key]}
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mt-10 profile-surface-strong rounded-3xl p-5 md:p-6 text-white overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                Dashboard snapshot
              </p>
              <h2 className="text-xl font-semibold">Live LifeLog view</h2>
              <p className="text-xs text-white/70">
                Pinned, due soon, and calendar from your notes.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="profile-chip px-3 py-1 text-[11px]">
                Pinned {dashboardStats.pinned}
              </span>
              <span className="profile-chip px-3 py-1 text-[11px] text-[#5EA2EF]">
                Upcoming {dashboardStats.upcoming}
              </span>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr] items-start mt-5">
            <div className="space-y-4">
              <div className="profile-surface rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                      Pinned + due soon
                    </p>
                    <p className="text-xs text-white/70">
                      Real notes from your workspace
                    </p>
                  </div>
                  <span className="px-3 py-1 text-[11px] rounded-full profile-chip text-white/80">
                    {priorityNotes.length
                      ? `${priorityNotes.length} highlighted`
                      : "No priority notes yet"}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {priorityNotes.length === 0 ? (
                    <p className="text-sm text-white/60">
                      Pin notes or add due dates to see them here.
                    </p>
                  ) : (
                    priorityNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-start justify-between gap-3 rounded-xl profile-surface px-3 py-3"
                      >
                        <div className="space-y-1 text-left">
                          <p className="text-sm font-semibold text-white line-clamp-2">
                            {note.title || "Untitled note"}
                          </p>
                          <p className="text-[11px] text-white/70">
                            {note.isPinned ? "Pinned • " : ""}
                            {formatDue(note)}
                          </p>
                          {note.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {note.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[11px] profile-chip text-white/80"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: note.color || "#5EA2EF" }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="profile-surface rounded-2xl p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total notes", value: dashboardStats.total },
                    { label: "Pinned", value: dashboardStats.pinned },
                    { label: "Upcoming", value: dashboardStats.upcoming },
                    { label: "With dates", value: dashboardStats.dated },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl profile-surface p-3 text-left"
                    >
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                        {stat.label}
                      </p>
                      <p className="text-lg font-semibold text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="profile-surface rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleMonthChange(-1)}
                    className="text-lg px-2 py-1 rounded-full profile-chip transition-colors"
                  >
                    ‹
                  </button>
                  <div className="text-sm font-semibold text-white">
                    {format(calendarMonth, "MMMM yyyy")}
                  </div>
                  <button
                    onClick={() => handleMonthChange(1)}
                    className="text-lg px-2 py-1 rounded-full profile-chip transition-colors"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mt-3 text-[11px] text-white/60">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <span key={day} className="text-center">
                        {day}
                      </span>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7 gap-2 mt-2">
                  {calendarDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const hasNotes = !!notesByDate[key];
                    const selected = isSameDay(day, selectedDate);
                    const inMonth = isSameMonth(day, calendarMonth);
                    return (
                      <button
                        key={key}
                        onClick={() => handleDateSelect(day)}
                        className={`relative h-12 rounded-xl text-xs transition-all ${
                          selected
                            ? "profile-chip text-white shadow-[0_0_0_1px_rgba(94,162,239,0.2)]"
                            : inMonth
                            ? "profile-surface text-white/80 hover:shadow-[0_0_0_1px_rgba(94,162,239,0.18)]"
                            : "profile-surface text-white/40 opacity-70"
                        }`}
                      >
                        <span className="absolute top-1 left-1 text-[11px]">
                          {format(day, "d")}
                        </span>
                        {isToday(day) && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] animate-pulse" />
                        )}
                        {hasNotes && (
                          <span className="absolute bottom-1 left-1 right-1 mx-auto h-1.5 rounded-full bg-gradient-to-r from-[#5EA2EF] to-[#0072F5]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl profile-surface p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                      {format(selectedDate, "MMM d, yyyy")}
                    </p>
                    <span className="text-xs text-white/70">
                      {selectedDateNotes.length} scheduled
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedDateNotes.length === 0 ? (
                      <p className="text-sm text-white/60">
                        No notes due on this date.
                      </p>
                    ) : (
                      selectedDateNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between gap-2 rounded-xl profile-surface px-3 py-2"
                        >
                          <div className="space-y-0.5 text-left">
                            <p className="text-sm font-semibold text-white line-clamp-1">
                              {note.title || "Untitled note"}
                            </p>
                            <p className="text-[11px] text-white/70">
                              {formatDue(note)}
                            </p>
                          </div>
                          <Chip
                            size="sm"
                            className="profile-chip text-white"
                            variant="flat"
                          >
                            {note.tags?.[0] ? `#${note.tags[0]}` : "Scheduled"}
                          </Chip>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid gap-4 md:grid-cols-2"
        >
          <Card className="profile-card">
            <CardBody className="p-5 space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Mood board <span>🌈</span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Craft your vibe by pinning colors and tags that matter most.
                Drag tags in Home to instantly filter and focus.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Focus", "Gratitude", "Planning", "Ideas"].map((tag) => (
                  <Chip
                    key={tag}
                    className="bg-[#0072F5]/10 text-[#0052CC] dark:text-[#5EA2EF]"
                    variant="flat"
                  >
                    #{tag}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card className="profile-card">
            <CardBody className="p-5 space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Quick actions <span>⚡</span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  onPress={() => navigate("/home")}
                  className="shadow-md shadow-[#0072F5]/20"
                >
                  Open Notes
                </Button>
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={() => navigate("/home")}
                  className="border-slate-200 dark:border-gray-700"
                >
                  Create a Note
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setShowSettings((prev) => !prev)}
                  className="text-[#0072F5]"
                >
                  {showSettings ? "Hide settings" : "Account settings"}
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Tip: Switch themes anytime with the sun/moon toggle in the
                navbar.
              </p>
            </CardBody>
          </Card>
        </motion.div>

        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 grid gap-4 md:grid-cols-2"
          >
            <Card className="profile-card">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Update email</h3>
                  <Chip
                    size="sm"
                    className="bg-[#0072F5]/10 text-[#0052CC] dark:text-[#5EA2EF]"
                    variant="flat"
                  >
                    Secure
                  </Chip>
                </div>
                <form className="space-y-3" onSubmit={handleUpdateEmail}>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-gray-400">
                      New email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-gray-400">
                      Password (for confirmation)
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Re-authentication keeps your account secure.
                    </p>
                    <Button
                      size="sm"
                      type="submit"
                      isLoading={savingEmail}
                      className="shadow-md shadow-[#0072F5]/20"
                    >
                      Save email
                    </Button>
                  </div>
                  {emailStatus && (
                    <p
                      className={`text-xs ${
                        emailStatus.includes("successfully")
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {emailStatus}
                    </p>
                  )}
                </form>
              </CardBody>
            </Card>

            <Card className="profile-card">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Update password</h3>
                  <Chip
                    size="sm"
                    className="bg-[#0072F5]/10 text-[#0052CC] dark:text-[#5EA2EF]"
                    variant="flat"
                  >
                    Secure
                  </Chip>
                </div>
                <form className="space-y-3" onSubmit={handleUpdatePassword}>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-gray-400">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          current: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                      placeholder="Current password"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-gray-400">
                        New password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.next}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            next: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-gray-400">
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirm: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                        placeholder="Repeat new password"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Create a strong password to keep your notes safe.
                    </p>
                    <Button
                      size="sm"
                      type="submit"
                      isLoading={savingPassword}
                      className="shadow-md shadow-[#0072F5]/20"
                    >
                      Save password
                    </Button>
                  </div>
                  {passwordStatus && (
                    <p
                      className={`text-xs ${
                        passwordStatus.includes("successfully")
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {passwordStatus}
                    </p>
                  )}
                </form>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Profile;

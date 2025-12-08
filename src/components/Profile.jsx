import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardBody } from "@heroui/card";
import { Button, Avatar, Chip } from "@heroui/react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";

const statCards = [
  { label: "Notes", key: "notes" },
  { label: "Pinned", key: "pinned" },
  { label: "Tags", key: "tags" },
  { label: "Daily streak", key: "streak" },
];

function Profile() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ notes: 0, pinned: 0, tags: 0, streak: 0 });
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
  const user = auth.currentUser;

  const toDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
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
    const fetchStats = async () => {
      if (!user) return;
      const notesRef = collection(db, "notes");
      const q = query(notesRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const tagSet = new Set();
      let pinnedCount = 0;
      const activityDays = new Set();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data?.isPinned) pinnedCount += 1;
        (data?.tags || []).forEach((tag) => tagSet.add(tag));
        const createdKey = formatDayKey(data?.createdAt || data?.lastModified);
        const editedKey = formatDayKey(data?.lastModified);
        if (createdKey) activityDays.add(createdKey);
        if (editedKey) activityDays.add(editedKey);
      });

      setStats({
        notes: snapshot.size,
        pinned: pinnedCount,
        tags: tagSet.size,
        streak: calculateStreak(activityDays),
      });
    };

    fetchStats();
  }, [user]);

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center text-slate-900 dark:text-gray-100" style={{ background: "var(--app-bg)" }}>
        <p className="text-lg text-slate-700 dark:text-gray-200">Please sign in to view your profile.</p>
        <Button onPress={() => navigate("/signin")}>Go to Sign In</Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-900 dark:text-gray-100" style={{ background: "transparent" }}>
      <div className="relative max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Profile</p>
            <h1 className="text-3xl font-bold mt-2 flex items-center gap-2">
              Hello, {user.displayName || "Explorer"} <span className="text-2xl">👋</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">{user.email}</p>
          </div>
          <Avatar
            className="w-16 h-16 text-xl ring-4 ring-[#0072F5]/20"
            src={user.photoURL}
            name={user.displayName?.[0]?.toUpperCase() || "U"}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((item) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: statCards.indexOf(item) * 0.08 }}
            >
              <Card className="bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-gray-800 shadow-xl shadow-black/10">
                <CardBody className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-3xl font-semibold mt-2">{stats[item.key]}</p>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid gap-4 md:grid-cols-2"
        >
          <Card className="bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-gray-800 shadow-xl shadow-black/10">
            <CardBody className="p-5 space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Mood board <span>🌈</span>
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Craft your vibe by pinning colors and tags that matter most. Drag tags in Home to instantly filter and focus.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Focus", "Gratitude", "Planning", "Ideas"].map((tag) => (
                  <Chip key={tag} className="bg-[#0072F5]/10 text-[#0052CC] dark:text-[#5EA2EF]" variant="flat">
                    #{tag}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-gray-800 shadow-xl shadow-black/10">
            <CardBody className="p-5 space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Quick actions <span>⚡</span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onPress={() => navigate("/home")} className="shadow-md shadow-[#0072F5]/20">
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
                Tip: Switch themes anytime with the sun/moon toggle in the navbar.
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
            <Card className="bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-gray-800 shadow-xl shadow-black/10">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Update email</h3>
                  <Chip size="sm" className="bg-[#0072F5]/10 text-[#0052CC] dark:text-[#5EA2EF]" variant="flat">
                    Secure
                  </Chip>
                </div>
                <form className="space-y-3" onSubmit={handleUpdateEmail}>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-gray-400">New email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-gray-400">Password (for confirmation)</label>
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
                        emailStatus.includes("successfully") ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {emailStatus}
                    </p>
                  )}
                </form>
              </CardBody>
            </Card>

            <Card className="bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-gray-800 shadow-xl shadow-black/10">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Update password</h3>
                  <Chip size="sm" className="bg-[#0072F5]/10 text-[#0052CC] dark:text-[#5EA2EF]" variant="flat">
                    Secure
                  </Chip>
                </div>
                <form className="space-y-3" onSubmit={handleUpdatePassword}>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-gray-400">Current password</label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({ ...prev, current: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                      placeholder="Current password"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-gray-400">New password</label>
                      <input
                        type="password"
                        value={passwordForm.next}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, next: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-gray-700 bg-white/90 dark:bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]/30"
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-gray-400">Confirm new password</label>
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
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
                        passwordStatus.includes("successfully") ? "text-emerald-600" : "text-red-500"
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

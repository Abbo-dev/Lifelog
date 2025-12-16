import { Button, Card, CardBody, Chip } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { importLocalNotesToCloud } from "../services/notesMigration";
import { loadLocalNotes } from "../utils/localNotes";

const features = {
  free: [
    "Local-only notes (this device)",
    "Rich text editor",
    "Tags, colors, pinning",
    "Due dates + filters",
  ],
  premium: [
    "Cloud sync across devices",
    "Automatic backups",
    "Real-time updates",
    "Sync smart folders",
  ],
};

function Pricing() {
  const { user, plan, isPremium, refreshPlan, planLoading } = useAuth();
  const navigate = useNavigate();
  const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL;
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  const emailLabel = useMemo(() => {
    const email = user?.email || "";
    if (!email) return "";
    return email.length > 32 ? `${email.slice(0, 29)}…` : email;
  }, [user?.email]);

  const localNotesCount = useMemo(() => {
    if (!user?.uid) return 0;
    return loadLocalNotes(user.uid).length;
  }, [user?.uid]);

  const importedFlagKey = user?.uid ? `lifelog_cloudImported_${user.uid}` : null;
  const wasImported = useMemo(() => {
    if (!importedFlagKey) return false;
    try {
      return window.localStorage.getItem(importedFlagKey) === "1";
    } catch {
      return false;
    }
  }, [importedFlagKey]);

  return (
    <div
      className="relative overflow-hidden text-slate-900 dark:text-white min-h-screen flex flex-col items-center px-4 pt-14 md:pt-16 pb-24"
      style={{ background: "var(--app-bg)" }}
    >
      <div className="relative max-w-5xl w-full z-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/70">
            Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Simple plans for a calm workflow
          </h1>
          <p className="text-base md:text-lg text-slate-700 dark:text-white/75 max-w-2xl mx-auto">
            Keep notes free on one device, or upgrade to sync, backups, and
            premium workflows.
          </p>
        </motion.div>

        {user && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-700 dark:text-white/80">
              Signed in as{" "}
              <span className="font-medium text-slate-900 dark:text-white">
                {user.displayName || emailLabel || "Account"}
              </span>
              <span className="mx-2 text-slate-400">•</span>
              Current plan{" "}
              <Chip
                size="sm"
                className={
                  isPremium
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
                    : "bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-white/80"
                }
              >
                {isPremium ? "Premium" : plan === "free" ? "Free" : plan}
              </Chip>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                className="border border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-[#2a2a2a] text-slate-800 dark:text-gray-200"
                isLoading={planLoading}
                onPress={() => refreshPlan()}
              >
                Refresh plan
              </Button>
              <Button
                size="sm"
                className="bg-[#0072F5] text-white hover:bg-[#0052CC]"
                onPress={() => navigate("/home")}
              >
                Go to app
              </Button>
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="bg-white/70 dark:bg-black/20 border border-white/10 backdrop-blur-xl">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-white/60">
                    Free
                  </p>
                  <p className="text-3xl font-bold mt-1">$0</p>
                  <p className="text-sm text-slate-600 dark:text-white/70">
                    Great for one device.
                  </p>
                </div>
                {!isPremium && (
                  <Chip
                    size="sm"
                    className="bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-white/80"
                  >
                    Current
                  </Chip>
                )}
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-white/75">
                {features.free.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5EA2EF]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 dark:text-white/60">
                Notes are stored in your browser on this device only.
              </p>
            </CardBody>
          </Card>

          <Card className="bg-[#0b1a33]/95 border border-[#5EA2EF]/30 text-white shadow-[0_25px_70px_rgba(0,114,245,0.25)]">
            <CardBody className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                    Premium
                  </p>
                  <p className="text-3xl font-bold mt-1">$4.99</p>
                  <p className="text-sm text-white/70">per month</p>
                </div>
                {isPremium && (
                  <Chip
                    size="sm"
                    className="bg-emerald-400/15 text-emerald-100 border border-emerald-300/20"
                  >
                    Active
                  </Chip>
                )}
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                {features.premium.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 space-y-2">
                <Button
                  className="w-full bg-white text-slate-900 hover:bg-white/90"
                  onPress={() => {
                    if (checkoutUrl) window.location.href = checkoutUrl;
                    else window.location.href = "mailto:support@lifelog.app";
                  }}
                >
                  {checkoutUrl ? "Upgrade" : "Contact to upgrade"}
                </Button>
                <p className="text-xs text-white/65">
                  After upgrading, click “Refresh plan” to unlock premium sync.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {user && isPremium && localNotesCount > 0 && (
          <div className="mt-6 rounded-2xl border border-emerald-300/25 bg-emerald-50/70 dark:bg-emerald-500/10 dark:border-emerald-400/25 backdrop-blur-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-slate-800 dark:text-emerald-100">
                <span className="font-semibold">Import local notes:</span> found{" "}
                {localNotesCount} note{localNotesCount === 1 ? "" : "s"} saved
                on this device.
                {importStatus ? (
                  <span className="block mt-1 text-xs text-slate-600 dark:text-emerald-100/80">
                    {importStatus}
                  </span>
                ) : null}
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-500"
                isLoading={importing}
                onPress={async () => {
                  if (!user?.uid) return;
                  setImportStatus("");
                  setImporting(true);
                  try {
                    const result = await importLocalNotesToCloud(user.uid);
                    setImportStatus(`Imported ${result.imported} note(s) to the cloud.`);
                    try {
                      if (importedFlagKey) {
                        window.localStorage.setItem(importedFlagKey, "1");
                      }
                    } catch {
                      // Ignore localStorage write failures.
                    }
                  } catch (error) {
                    setImportStatus(error?.message || "Import failed.");
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                {wasImported ? "Re-import" : "Import now"}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl p-5 text-sm text-slate-700 dark:text-white/75">
          <p className="font-semibold text-slate-900 dark:text-white mb-2">
            How premium works (right now)
          </p>
          <ul className="space-y-1">
            <li>1) You purchase Premium (Stripe link or email for now).</li>
            <li>
              2) We mark your account as Premium in Firebase (temporary manual
              step).
            </li>
            <li>3) You refresh your plan and syncing turns on.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Pricing;

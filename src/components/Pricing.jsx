import { Button, Card, CardBody, Chip, Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { importLocalNotesToCloud } from "../services/notesMigration";
import { loadLocalNotes } from "../utils/localNotes";

const features = {
  free: [
    "Local-only notes (this device)",
    "Rich text editor (formatting + links)",
    "Tags + custom tag colors",
    "Due dates, pinning, and dashboard",
    "Smart folders + fast search (Ctrl/Cmd+K)",
    "Starter templates (daily log, meeting notes)",
  ],
  premium: [
    "Cloud sync across devices",
    "Real-time updates + offline cache",
    "Shareable read-only note links",
    "Image uploads (Firebase Storage)",
    "Sync smart folders + tag colors",
    "Import local notes to cloud",
  ],
};

function Pricing() {
  const { user, plan, isPremium, refreshPlan, planLoading } = useAuth();
  const navigate = useNavigate();
  const checkoutUrlMonthly = import.meta.env.VITE_CHECKOUT_URL;
  const checkoutUrlAnnual = import.meta.env.VITE_CHECKOUT_URL_ANNUAL;
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");

  const monthlyPrice = 4.99;
  const annualPrice = 49.99;
  const annualSavingsPercent = Math.max(
    0,
    Math.round(100 - (annualPrice / (monthlyPrice * 12)) * 100)
  );
  const annualEffectiveMonthly = (annualPrice / 12).toFixed(2);

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

  const selectedCheckoutUrl =
    billingCycle === "annual" ? checkoutUrlAnnual : checkoutUrlMonthly;
  const mailtoUpgradeUrl =
    billingCycle === "annual"
      ? "mailto:support@lifelog.app?subject=LifeLog%20Premium%20Annual"
      : "mailto:support@lifelog.app?subject=LifeLog%20Premium%20Monthly";

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
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl p-4 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-3">
            <div className="text-sm text-slate-700 dark:text-white/80">
              Signed in as{" "}
              <span className="font-medium text-slate-900 dark:text-white">
                {user.displayName || emailLabel || "Account"}
              </span>
              <span className="mx-2 text-slate-400">•</span>
              Current plan{" "}
              {planLoading ? (
                <Skeleton className="h-6 w-20 rounded-full inline-block align-middle" />
              ) : (
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
              )}
            </div>
            <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-end">
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

        <div className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors ${
                billingCycle === "monthly"
                  ? "bg-[#0072F5] text-white"
                  : "text-slate-700 dark:text-white/80 hover:bg-white/70 dark:hover:bg-white/10"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-[#0072F5] text-white"
                  : "text-slate-700 dark:text-white/80 hover:bg-white/70 dark:hover:bg-white/10"
              }`}
            >
              Annual
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border border-emerald-300/20">
                Save {annualSavingsPercent}%
              </span>
            </button>
          </div>
        </div>

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
                  <p className="text-3xl font-bold mt-1">
                    {billingCycle === "annual"
                      ? `$${annualPrice.toFixed(2)}`
                      : `$${monthlyPrice.toFixed(2)}`}
                  </p>
                  <p className="text-sm text-white/70">
                    {billingCycle === "annual" ? "per year" : "per month"}
                  </p>
                  {billingCycle === "annual" ? (
                    <p className="text-xs text-white/70 mt-1">
                      ${annualEffectiveMonthly}/mo billed yearly
                    </p>
                  ) : null}
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
                    if (selectedCheckoutUrl) window.location.href = selectedCheckoutUrl;
                    else window.location.href = mailtoUpgradeUrl;
                  }}
                >
                  {selectedCheckoutUrl
                    ? billingCycle === "annual"
                      ? "Upgrade (annual)"
                      : "Upgrade (monthly)"
                    : "Contact to upgrade"}
                </Button>
                <p className="text-xs text-white/65">
                  After upgrading, click “Refresh plan” to unlock premium sync.
                </p>
                {billingCycle === "annual" && !checkoutUrlAnnual ? (
                  <p className="text-xs text-white/65">
                    Annual checkout link not set yet — contact to get annual billing.
                  </p>
                ) : null}
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
            How Premium works
          </p>
          <ul className="space-y-1">
            <li>1) Upgrade (monthly or annual).</li>
            <li>2) Come back to the app.</li>
            <li>3) Tap “Refresh plan” to unlock sync + premium features.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500 dark:text-white/60">
            If Premium doesn&apos;t unlock within a few minutes, contact{" "}
            <a
              className="text-[#0072F5] hover:underline"
              href="mailto:support@lifelog.app"
            >
              support@lifelog.app
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default Pricing;

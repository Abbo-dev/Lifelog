import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  Chip,
  Skeleton,
} from "@heroui/react";
import { addToast } from "@heroui/toast";
import { CheckIcon } from "@heroicons/react/20/solid";
import { RocketLaunchIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { importLocalNotesToCloud } from "../services/notesMigration";
import { loadLocalNotes } from "../utils/localNotes";
import { createBillingPortalSession } from "../services/billingPortal";
import { TOAST_CLASSNAMES } from "../utils/toastClassnames";

const features = {
  free: [
    "Local notes on one device",
    "Rich editor (formatting + links)",
    "Tags + custom colors",
    "Pins, due dates, and dashboard",
    "Smart folders + fast search (Ctrl/Cmd+K)",
    "Starter templates (daily log, meeting notes)",
  ],
  premium: [
    "Cloud sync across devices",
    "Real-time updates + offline cache",
    "Memory map view",
    "Version history + restore",
    "Export to PDF + Markdown",
    "Shareable read-only note links",
    "Sync smart folders + tag colors",
    "Import local notes to cloud",
  ],
};

const pricingFaqItems = [
  {
    id: "cancel-anytime",
    question: "Can I cancel Premium anytime?",
    answer:
      "Yes. You can cancel directly from the billing portal whenever you want, with no hidden steps. Your Premium access typically stays active until the end of the current billing period, and after that you simply return to the Free plan without losing your notes.",
  },
  {
    id: "annual-discount",
    question: "Is there an annual discount?",
    answer:
      "Yes. Annual billing is priced lower than paying month to month, so you save over the year. When you switch the toggle to Annual you will see the discounted total and the effective monthly rate upfront.",
  },
  {
    id: "downgrade",
    question: "What happens if I downgrade?",
    answer:
      "You keep all of your notes. Local notes stay on your device as usual, and cloud sync simply stops after your Premium period ends. If you decide to return to Premium later, you can upgrade again and continue syncing.",
  },
  {
    id: "billing-portal",
    question: "Where do I manage billing and invoices?",
    answer:
      "After upgrading, the billing portal is the place to update your payment method, download invoices, and manage your subscription. If you are signed in, you can open the portal directly from this page with one click.",
  },
  {
    id: "refunds",
    question: "Do you offer refunds?",
    answer:
      "If something goes wrong with your billing, contact support and we will help you sort it out. We want you to feel confident when you upgrade, so if there is a mistake or an issue, we will work with you to make it right.",
  },
];

function Pricing() {
  const { user, plan, isPremium, refreshPlan, planLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutUrlMonthly = import.meta.env.VITE_CHECKOUT_URL;
  const checkoutUrlAnnual = import.meta.env.VITE_CHECKOUT_URL_ANNUAL;
  const apiBaseUrlRaw = import.meta.env.VITE_API_BASE_URL;
  const apiBaseUrl = (apiBaseUrlRaw || "").replace(/\/+$/, "");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalStatus, setPortalStatus] = useState("");

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

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (!success && !canceled) return;

    if (success === "1") {
      addToast({
        title: "Thanks for upgrading",
        description: "Refreshing your plan…",
        timeout: 6000,
        shouldShowTimeoutProgress: true,
        classNames: TOAST_CLASSNAMES,
      });
      refreshPlan();
    } else if (canceled === "1") {
      addToast({
        title: "Checkout canceled",
        description: "No charges were made.",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        classNames: TOAST_CLASSNAMES,
      });
    }

    setSearchParams({}, { replace: true });
  }, [refreshPlan, searchParams, setSearchParams]);

  const startUpgrade = async () => {
    const fallbackUrl = selectedCheckoutUrl || mailtoUpgradeUrl;

    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }

    if (!apiBaseUrl) {
      window.location.href = fallbackUrl;
      return;
    }

    setCheckoutLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${apiBaseUrl}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ billingCycle }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to start checkout.");
      }
      if (!payload?.url) {
        throw new Error("Checkout URL missing from server response.");
      }
      window.location.href = payload.url;
    } catch (error) {
      console.error("Checkout failed", error);
      addToast({
        title: "Checkout unavailable",
        description: "Using the fallback checkout link.",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        classNames: TOAST_CLASSNAMES,
      });
      window.location.href = fallbackUrl;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openBillingPortal = async () => {
    if (!user) {
      navigate("/auth?mode=signin");
      return;
    }
    if (!apiBaseUrl) {
      setPortalStatus("Billing portal is not configured yet.");
      addToast({
        title: "Billing portal unavailable",
        description: "Set VITE_API_BASE_URL to enable the billing portal.",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        classNames: TOAST_CLASSNAMES,
      });
      return;
    }

    setPortalStatus("");
    setPortalLoading(true);
    try {
      const token = await user.getIdToken();
      const url = await createBillingPortalSession({ apiBaseUrl, token });
      window.location.href = url;
    } catch (error) {
      console.error("Billing portal failed", error);
      const message = error?.message || "Unable to open billing portal.";
      setPortalStatus(message);
      addToast({
        title: "Billing portal unavailable",
        description: message,
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        classNames: TOAST_CLASSNAMES,
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const startFree = () => {
    if (user) {
      navigate("/app");
      return;
    }
    navigate("/auth?mode=signup");
  };

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
                onPress={() => navigate("/app")}
              >
                Open LifeLog
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
          <Card className="relative h-full overflow-hidden border border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.18)]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -top-28 -right-24 h-64 w-64 rounded-full bg-[#5EA2EF]/18 blur-3xl" />
              <div className="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[#0072F5]/10 blur-3xl" />
            </div>
            <CardBody className="relative p-7 flex flex-col h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/60">
                    Free
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      $0
                    </p>
                    <span className="pb-1 text-sm text-slate-600 dark:text-white/70">
                      forever
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-white/75 max-w-xs">
                    Everything you need to get started on one device.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {user && !isPremium ? (
                    <Chip
                      size="sm"
                      className="bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-white/80"
                    >
                      Current
                    </Chip>
                  ) : (
                    <Chip
                      size="sm"
                      className="bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-white/80"
                    >
                      Starter
                    </Chip>
                  )}
                  <div className="h-11 w-11 rounded-2xl border border-[#0072F5]/20 dark:border-white/10 bg-white/60 dark:bg-white/5 flex items-center justify-center">
                    <SparklesIcon className="h-6 w-6 text-[#0072F5] dark:text-[#5EA2EF]" />
                  </div>
                </div>
              </div>

              <div className="mt-6 h-px w-full bg-slate-200/80 dark:bg-white/10" />

              <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-white/80">
                {features.free.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/12 dark:bg-[#0072F5]/20">
                      <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-xs text-slate-600 dark:text-white/60">
                Your notes stay on this device (no cloud sync).
              </p>

              <div className="mt-auto pt-6">
                <Button
                  variant="flat"
                  className="w-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/10"
                  onPress={startFree}
                >
                  {user ? "Open LifeLog" : "Start free"}
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="relative h-full rounded-3xl p-[1px] bg-gradient-to-br from-[#0072F5] via-[#5EA2EF] to-[#9353D3] shadow-[0_25px_70px_rgba(0,114,245,0.25)]">
            <Card className="relative h-full overflow-hidden rounded-3xl bg-[#0b1a33]/95 text-white border border-white/10">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute -top-28 -left-24 h-64 w-64 rounded-full bg-[#0072F5]/25 blur-3xl" />
                <div className="absolute -bottom-28 -right-24 h-64 w-64 rounded-full bg-[#9353D3]/18 blur-3xl" />
              </div>
              <CardBody className="relative p-7 flex flex-col h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                      Premium
                    </p>
                    <div className="mt-3 flex items-end gap-2">
                      <p className="text-4xl font-extrabold">
                        {billingCycle === "annual"
                          ? `$${annualPrice.toFixed(2)}`
                          : `$${monthlyPrice.toFixed(2)}`}
                      </p>
                      <span className="pb-1 text-sm text-white/70">
                        {billingCycle === "annual" ? "/yr" : "/mo"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/70 max-w-xs">
                      Sync, backups, sharing, and advanced workflows.
                    </p>
                    {billingCycle === "annual" ? (
                      <p className="mt-1 text-xs text-white/65">
                        ${annualEffectiveMonthly}/mo billed yearly
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-white/65">Cancel anytime.</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {user && isPremium ? (
                      <Chip
                        size="sm"
                        className="bg-emerald-400/15 text-emerald-100 border border-emerald-300/20"
                      >
                        Active
                      </Chip>
                    ) : (
                      <Chip
                        size="sm"
                        className="bg-emerald-400/15 text-emerald-100 border border-emerald-300/20"
                      >
                        Most popular
                      </Chip>
                    )}
                    <div className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                      <RocketLaunchIcon className="h-6 w-6 text-white/85" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 h-px w-full bg-white/10" />

                <ul className="mt-6 space-y-3 text-sm text-white/80">
                  {features.premium.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/15">
                        <CheckIcon className="h-3.5 w-3.5 text-emerald-300" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6 space-y-2">
                  <Button
                    className="w-full bg-white text-slate-900 hover:bg-white/90"
                    isLoading={isPremium ? portalLoading : checkoutLoading}
                    onPress={isPremium ? openBillingPortal : startUpgrade}
                  >
                    {isPremium
                      ? "Manage subscription"
                      : billingCycle === "annual"
                        ? "Upgrade (annual)"
                        : "Upgrade (monthly)"}
                  </Button>
                  {isPremium ? (
                    <p className="text-xs text-white/65">
                      Update payment details, download invoices, or cancel anytime.
                    </p>
                  ) : (
                    <p className="text-xs text-white/65">
                      Premium unlocks automatically after checkout. If it doesn&apos;t, click
                      “Refresh plan”.
                    </p>
                  )}
                  {isPremium && portalStatus ? (
                    <p className="text-xs text-white/65">{portalStatus}</p>
                  ) : null}
                  {billingCycle === "annual" && !checkoutUrlAnnual && !apiBaseUrl ? (
                    <p className="text-xs text-white/65">
                      Annual checkout link not set yet — contact to get annual billing.
                    </p>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          </div>
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

        <div className="mt-10">
          <div className="text-center mb-7 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/70">
              Pricing FAQ
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              Pricing questions, answered.
            </h2>
            <p className="text-sm text-slate-700 dark:text-white/75 max-w-2xl mx-auto">
              Clear answers about billing, upgrades, and what happens if you change plans.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-3xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-r from-[#5EA2EF]/20 via-[#0072F5]/15 to-transparent blur-3xl opacity-70"
            />
            <div className="relative glass-panel-soft rounded-3xl border border-white/10 p-4 md:p-6 text-left">
              <Accordion
                variant="splitted"
                selectionMode="multiple"
                defaultExpandedKeys={["cancel-anytime"]}
                showDivider={false}
                className="gap-3"
                itemClasses={{
                  base:
                    "rounded-2xl border border-white/10 bg-white/70 dark:bg-white/5 shadow-[0_16px_40px_rgba(15,32,65,0.12)] backdrop-blur-xl",
                  trigger: "px-4 py-4 gap-4",
                  title: "text-sm md:text-base font-semibold text-slate-900 dark:text-white",
                  content:
                    "px-4 pb-4 pt-0 text-sm text-slate-700 dark:text-white/70",
                  indicator: "text-[#0072F5] dark:text-[#5EA2EF]",
                }}
              >
                {pricingFaqItems.map((item) => (
                  <AccordionItem
                    key={item.id}
                    aria-label={item.question}
                    title={item.question}
                  >
                    <p className="text-sm text-slate-700 dark:text-white/70">
                      {item.answer}
                    </p>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;

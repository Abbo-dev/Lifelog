import { useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Image } from "@heroui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/20/solid";
import { RocketLaunchIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { auth } from "../firebase";

import Calendar from "../assets/calendar.svg";
import reord from "../assets/reorder.svg";
import capture from "../assets/capture.svg";
import PreviewScreenshot from "../assets/preview.png";

const highlights = [
  {
    title: "Tags + colors + pins",
    body: "Give every note a clear visual priority.",
    icon: reord,
    meta: "Organize",
    points: [
      "Color-coded tags for quick scanning",
      "Pin top notes to stay focused",
      "Drag to reorder and group themes",
    ],
  },
  {
    title: "Due dates + reminders",
    body: "Plan ahead with simple timelines and nudges.",
    icon: Calendar,
    meta: "Stay on track",
    points: [
      "Set due dates on any note or task",
      "Spot upcoming and overdue items fast",
      "Optional reminders that keep you on pace",
    ],
  },
  {
    title: "Rich editor",
    body: "Capture ideas fast with clean formatting tools.",
    icon: capture,
    meta: "Create",
    points: [
      "Quick formatting for headings and lists",
      "Checklists, links, and inline images",
      "Paste-friendly layouts that stay tidy",
    ],
  },
];

const pricingTiers = {
  free: [
    "Local notes on one device",
    "Rich editor (formatting + links)",
    "Tags + custom colors",
    "Pins, due dates, and dashboard",
    "Smart folders + fast search",
  ],
  premium: [
    "Cloud sync across devices",
    "Real-time updates + offline cache",
    "Shareable read-only note links",
    "Image uploads + fast previews",
    "Sync smart folders + tag colors",
  ],
};

function Content() {
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
    });
    return unsubscribe;
  }, []);

  const isAuthenticated = !!authUser;
  const displayName = authUser?.displayName?.trim();

  const primaryCta = isAuthenticated
    ? { label: "Open LifeLog", to: "/home" }
    : { label: "Get Started", to: "/auth?mode=signup" };

  const secondaryCta = isAuthenticated
    ? { label: "View profile", to: "/profile" }
    : { label: "Sign in", to: "/auth?mode=signin" };

  const tertiaryCta = { label: "See pricing", to: "/pricing" };
  const finalCta = isAuthenticated
    ? { label: "Open dashboard", to: "/home" }
    : { label: "Create free account", to: "/auth?mode=signup" };

  return (
    <div
      className="relative overflow-hidden text-slate-900 dark:text-white min-h-screen flex flex-col items-center px-4 pt-14 md:pt-16 pb-24"
    >
      <div className="relative max-w-6xl w-full text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-7"
        >
          <div className="flex justify-center">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-700 dark:text-white/80 px-4 py-2 rounded-full glass-chip">
              {isAuthenticated
                ? `Welcome back${displayName ? `, ${displayName}` : ""}`
                : "Your life, beautifully logged"}
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-b from-[#5EA2EF] to-[#0072F5] bg-clip-text text-transparent drop-shadow">
              LifeLog
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-700 dark:text-white/80 max-w-2xl mx-auto">
            {isAuthenticated
              ? "Pick up where you left off—your notes and routines are waiting."
              : "Capture thoughts, stay organized, and move forward."}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to={primaryCta.to}>
              <Button
                color="primary"
                className="px-5 py-3 text-base font-semibold shadow-[0_15px_40px_rgba(0,114,245,0.35)] hover:-translate-y-0.5 hover:scale-[1.02] transition-transform"
              >
                {primaryCta.label}
              </Button>
            </Link>
            <Link to={secondaryCta.to}>
              <Button
                variant="flat"
                className="px-5 py-3 text-base font-semibold glass-chip text-slate-900 dark:text-white border border-white/20 hover:-translate-y-0.5 hover:scale-[1.02] transition-transform"
              >
                {secondaryCta.label}
              </Button>
            </Link>
            <Link
              to={tertiaryCta.to}
              className="text-sm font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {tertiaryCta.label}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 dark:text-white/75">
            <span className="px-3 py-1 rounded-full glass-chip border border-white/10 text-slate-700 dark:text-white/80">
              No clutter. Your notes, secure—with optional premium sync.
            </span>
            <span className="px-3 py-1 rounded-full glass-chip border border-white/10 text-slate-700 dark:text-white/80">
              Fast search, drag filters, instant pinning.
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="text-center mb-7 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              In-app preview
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              Your day, in one dashboard.
            </h2>
            <p className="text-sm text-slate-700 dark:text-white/70 max-w-2xl mx-auto">
              Pins, tags, filters, and reminders—always visible.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-5xl xl:max-w-6xl 2xl:max-w-[68rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-10 rounded-[40px] bg-gradient-to-r from-[#5EA2EF]/25 via-[#0072F5]/20 to-transparent blur-3xl opacity-70"
            />
            <img
              src={PreviewScreenshot}
              alt="LifeLog dashboard preview"
              width={1886}
              height={1282}
              className="relative block w-full h-auto rounded-[28px] ring-1 ring-black/10 dark:ring-white/15 shadow-[0_35px_90px_rgba(0,0,0,0.55)]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-16 space-y-6"
        >
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              What you get
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mt-1">
              Everything you need. Nothing you don't.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            {highlights.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 * idx }}
                className="group glass-panel-soft relative overflow-hidden rounded-2xl p-6 border border-white/10 text-slate-900 dark:text-white transition-all hover:border-white/20 hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)]"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-[#5EA2EF]/20 blur-3xl opacity-70 transition-opacity group-hover:opacity-90"
                />
                <div className="relative space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <span className="inline-flex items-center rounded-full border border-white/20 bg-white/70 dark:bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/70">
                        {item.meta}
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-white/75">
                        {item.body}
                      </p>
                    </div>
                    <span className="glow-icon w-12 h-12 flex items-center justify-center shrink-0">
                      <Image src={item.icon} alt={item.title} className="w-6 h-6 object-contain" />
                    </span>
                  </div>
                  <div className="h-px w-full bg-white/20 dark:bg-white/10" />
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-white/75">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/12 dark:bg-[#0072F5]/20">
                          <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl p-8 shadow-[0_25px_70px_rgba(0,0,0,0.18)]">
            <div className="text-center space-y-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/70">
                Pricing
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
                Free forever. Upgrade for sync.
              </h2>
              <p className="text-sm md:text-base text-slate-700 dark:text-white/75 max-w-2xl mx-auto">
                Start free on one device, or go Premium for cloud sync and backups.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
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
                      <Chip
                        size="sm"
                        className="bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-white/80"
                      >
                        Starter
                      </Chip>
                      <div className="h-11 w-11 rounded-2xl border border-[#0072F5]/20 dark:border-white/10 bg-white/60 dark:bg-white/5 flex items-center justify-center">
                        <SparklesIcon className="h-6 w-6 text-[#0072F5] dark:text-[#5EA2EF]" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 h-px w-full bg-slate-200/80 dark:bg-white/10" />

                  <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-white/80">
                    {pricingTiers.free.map((item) => (
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
                    <Link to={primaryCta.to}>
                      <Button
                        size="sm"
                        variant="flat"
                        className="w-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/10"
                      >
                        {isAuthenticated ? "Open LifeLog" : "Start free"}
                      </Button>
                    </Link>
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
                          <p className="text-4xl font-extrabold">$4.99</p>
                          <span className="pb-1 text-sm text-white/70">/mo</span>
                        </div>
                        <p className="mt-2 text-sm text-white/70 max-w-xs">
                          Sync, backups, sharing, and advanced workflows.
                        </p>
                        <p className="mt-1 text-xs text-white/65">
                          or $49.99/yr{" "}
                          <span className="text-emerald-300 font-semibold">
                            Save 17%
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Chip
                          size="sm"
                          className="bg-emerald-400/15 text-emerald-100 border border-emerald-300/20"
                        >
                          Best value
                        </Chip>
                        <div className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                          <RocketLaunchIcon className="h-6 w-6 text-white/85" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 h-px w-full bg-white/10" />

                    <ul className="mt-6 space-y-3 text-sm text-white/80">
                      {pricingTiers.premium.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/15">
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-300" />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-6">
                      <Link to="/pricing">
                        <Button
                          size="sm"
                          variant="flat"
                          className="w-full border border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                          View details
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="glass-panel-soft relative overflow-hidden rounded-[28px] border border-white/10 p-8">
            <div className="relative flex flex-col items-center text-center">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/70 dark:bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/70">
                Build your system
              </span>
              <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
                Turn scattered notes into a clear plan.
              </h2>
              <p className="mt-2 text-sm md:text-base text-slate-700 dark:text-white/75 max-w-2xl">
                Capture, tag, and pin ideas in seconds so the next step is always visible.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-slate-700 dark:text-white/75 sm:grid-cols-2">
                <li className="flex items-start justify-center gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/12 dark:bg-[#0072F5]/20">
                    <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                  </span>
                  <span>One dashboard for notes, tasks, and routines.</span>
                </li>
                <li className="flex items-start justify-center gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/12 dark:bg-[#0072F5]/20">
                    <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                  </span>
                  <span>Pin priorities and set due dates in seconds.</span>
                </li>
                <li className="flex items-start justify-center gap-3 sm:col-span-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/12 dark:bg-[#0072F5]/20">
                    <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                  </span>
                  <span>Find anything fast with tags and smart folders.</span>
                </li>
              </ul>
              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                <Link to={finalCta.to}>
                  <Button
                    color="primary"
                    className="px-5 shadow-[0_15px_40px_rgba(0,114,245,0.35)]"
                  >
                    {finalCta.label}
                  </Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-600 dark:text-white/65">
                {isAuthenticated
                  ? "You're signed in. Pick up where you left off."
                  : "Free to start. No credit card. Cancel anytime."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Content;

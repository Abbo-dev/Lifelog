import { useEffect, useState } from "react";
import { Button, Image } from "@heroui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../firebase";

import Calendar from "../assets/calendar.svg";
import reord from "../assets/reorder.svg";
import capture from "../assets/capture.svg";
import PreviewScreenshot from "../assets/preview.png";

const highlights = [
  {
    title: "Tags + colors + pins",
    body: "Keep priorities clear at a glance.",
    icon: reord,
  },
  {
    title: "Due dates + reminders",
    body: "See what matters next—no digging.",
    icon: Calendar,
  },
  {
    title: "Rich editor",
    body: "Write fast with formatting, links, and images.",
    icon: capture,
  },
];

const pricingTiers = {
  free: [
    "Local-only notes (this device)",
    "Rich text editor (formatting + links)",
    "Tags + custom tag colors",
    "Due dates, pinning, and dashboard",
    "Smart folders + fast search",
  ],
  premium: [
    "Cloud sync across devices",
    "Real-time updates + offline cache",
    "Shareable read-only note links",
    "Image uploads (Firebase Storage)",
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
    ? { label: "Go to the app", to: "/home" }
    : { label: "Get Started", to: "/signup" };

  const secondaryCta = isAuthenticated
    ? { label: "View profile", to: "/profile" }
    : { label: "Sign in", to: "/signin" };

  const tertiaryCta = { label: "See pricing", to: "/pricing" };

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
          <div className="relative mx-auto w-full max-w-5xl xl:max-w-6xl">
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
                className="glass-panel-soft rounded-2xl p-5 border border-white/10 text-slate-900 dark:text-white transition-all hover:border-white/20 hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)]"
              >
                <div className="flex items-start gap-4">
                  <span className="glow-icon w-12 h-12 flex items-center justify-center shrink-0">
                    <Image src={item.icon} alt={item.title} className="w-6 h-6 object-contain" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-white/75">
                      {item.body}
                    </p>
                  </div>
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
          <div className="glass-panel rounded-3xl p-8 border border-white/15">
            <div className="text-center space-y-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                Pricing
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                Free forever. Upgrade for sync.
              </h2>
              <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto">
                Start free on one device, or go Premium for cloud sync and backups.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 text-left">
              <div className="glass-panel-soft rounded-2xl p-5 border border-white/10">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                  Free
                </p>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  {pricingTiers.free.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5EA2EF]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-panel-soft rounded-2xl p-5 border border-white/10">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                      Premium
                    </p>
                    <p className="text-2xl font-semibold text-white mt-1">
                      $4.99<span className="text-sm font-normal text-white/70">/mo</span>
                    </p>
                  </div>
                  <Link to="/pricing">
                    <Button
                      size="sm"
                      variant="flat"
                      className="glass-chip border border-white/20 text-white/90"
                    >
                      Details
                    </Button>
                  </Link>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  {pricingTiers.premium.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
              <Link to={primaryCta.to}>
                <Button
                  color="primary"
                  className="px-5 shadow-[0_15px_40px_rgba(0,114,245,0.35)]"
                >
                  {isAuthenticated ? "Go to app" : "Start free"}
                </Button>
              </Link>
              <Link to="/pricing">
                <Button
                  variant="flat"
                  className="px-5 glass-chip border border-white/20 text-white/90"
                >
                  See full pricing
                </Button>
              </Link>
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
          <div className="glass-panel-soft rounded-3xl p-8 border border-white/10 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              Ready to start?
            </h2>
            <p className="mt-2 text-sm md:text-base text-slate-700 dark:text-white/75 max-w-xl mx-auto">
              Create a note, tag it, and keep moving.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <Link to={primaryCta.to}>
                <Button
                  color="primary"
                  className="px-5 shadow-[0_15px_40px_rgba(0,114,245,0.35)]"
                >
                  {primaryCta.label}
                </Button>
              </Link>
              <Link to={secondaryCta.to}>
                <Button
                  variant="flat"
                  className="px-5 glass-chip text-slate-900 dark:text-white border border-white/20"
                >
                  {secondaryCta.label}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Content;

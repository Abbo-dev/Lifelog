import { useEffect, useState } from "react";
import { Button, Image } from "@heroui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../firebase";

import Calendar from "../assets/calendar.svg";
import reord from "../assets/reorder.svg";
import capture from "../assets/capture.svg";

const highlights = [
  {
    title: "Structured notes, zero clutter",
    body: "Tags, colors, and pinning keep priorities obvious and your workspace calm.",
    icon: reord,
  },
  {
    title: "Stay on time with ease",
    body: "Due dates, reminders, and filters surface what matters now—no digging required.",
    icon: Calendar,
  },
  {
    title: "Capture ideas in seconds",
    body: "Fast editor with rich text and media so sparks turn into finished thoughts.",
    icon: capture,
  },
];

const pillars = [
  {
    title: "Plan, capture, finish",
    accent: "🎯",
    points: [
      "Quick filters + search to find anything instantly.",
      "Grid or list layouts depending on your flow.",
      "Premium sync keeps every device aligned.",
    ],
  },
  {
    title: "Momentum that sticks",
    accent: "🔥",
    points: [
      "Daily streaks and pins keep important work on top.",
      "Due times show up across the app—never miss a beat.",
      "Light/Dark themes tuned for long sessions.",
    ],
  },
];

const statCards = [
  {
    label: "Avg. time saved",
    value: "12 min",
    desc: "per entry with quick filters",
    progress: 82,
  },
  {
    label: "Notes organized",
    value: "4.8k+",
    desc: "kept tidy with tags & pins",
    progress: 74,
  },
  {
    label: "Focus streaks",
    value: "94%",
    desc: "stay engaged with daily logging",
    progress: 93,
  },
];

const mockupTimeline = [
  {
    title: "Prep quarterly review",
    meta: "Pinned • Today, 4:00p",
    tone: "emerald",
  },
  {
    title: "Outline LifeLog updates",
    meta: "Due tomorrow • Reminder 6:30p",
    tone: "blue",
  },
  { title: "Share recap with team", meta: "Due Fri • Tag: work", tone: "cyan" },
];

const mockupInsights = [
  { label: "Pinned", value: "12" },
  { label: "Upcoming", value: "7" },
  { label: "Completed", value: "21" },
];

const mockupBars = [82, 58, 91, 66, 74];
const mockupFilters = ["Pinned", "Due soon", "Ideas", "Personal", "Work"];

function Content() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  const primaryCtaLabel = isAuthenticated ? "Open dashboard" : "Get Started";
  const secondaryCta = isAuthenticated
    ? { label: "Add another note", to: "/home" }
    : { label: "Create Account", to: "/signup" };

  const toneStyles = {
    emerald:
      "bg-emerald-400/10 border-emerald-300/25 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    blue: "bg-blue-400/10 border-blue-300/25 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    cyan: "bg-cyan-400/10 border-cyan-300/25 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.22)]",
  };

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
              Your life, beautifully logged
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-b from-[#5EA2EF] to-[#0072F5] bg-clip-text text-transparent drop-shadow">
              LifeLog
            </span>
          </h1>
          <p className="text-base md:text-lg text-slate-700 dark:text-white/80 max-w-2xl mx-auto">
            A playful, powerful space to capture thoughts, build routines, and
            celebrate progress—day after day.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/home">
              <Button
                color="primary"
                className="px-5 py-3 text-base font-semibold shadow-[0_15px_40px_rgba(0,114,245,0.35)] hover:-translate-y-0.5 hover:scale-[1.02] transition-transform"
              >
                {primaryCtaLabel}
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

        <div className="mt-20 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              Momentum stats
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mt-1">
              See the lift you get with LifeLog
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.05, duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-1 gap-8 text-left md:flex md:flex-wrap md:gap-6 md:justify-center"
          >
            {statCards.map((item) => (
              <div
                key={item.label}
                className="glass-panel-soft rounded-2xl p-5 border border-white/10 text-slate-900 dark:text-white md:min-w-[280px] md:flex-1"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/60">
                  {item.label}
                </p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">
                  {item.value}
                </p>
                <p className="text-sm text-slate-700 dark:text-white/70">{item.desc}</p>
                <div className="mt-4 h-1.5 rounded-full bg-slate-200/70 dark:bg-white/5 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#5EA2EF] to-[#0072F5]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="text-left mb-5 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              In-app preview
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              See how LifeLog keeps pins, filters, and reminders together.
            </p>
            <p className="text-sm text-slate-700 dark:text-white/70 max-w-2xl">
              This mockup shows the dashboard snapshot: pinned notes, quick filters, insights, and upcoming reminders—all in one place.
            </p>
          </div>
          <div className="mockup-window rounded-[28px] p-6 md:p-8 border border-white/15">
            <div className="flex items-center justify-between pb-5 border-b border-white/10 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_0_4px_rgba(16,192,103,0.14)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300/80 shadow-[0_0_0_4px_rgba(251,191,36,0.16)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 shadow-[0_0_0_4px_rgba(244,114,182,0.12)]" />
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/60">
                  LifeLog dashboard
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-chip px-3 py-1 text-[11px] text-slate-900 dark:text-white/85 border border-white/15">
                  Premium sync
                </span>
                <span className="glass-chip px-3 py-1 text-[11px] text-[#0a66d1] dark:text-[#5EA2EF] border border-white/15">
                  Focus mode
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[0.95fr,1.05fr] items-start mt-6">
              <div className="space-y-4">
                <div className="glass-panel-soft rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                        Today
                      </p>
                      <p className="text-sm text-white/80">Pinned + due soon</p>
                    </div>
                    <span className="px-3 py-1 text-[11px] rounded-full border border-white/10 bg-white/5 text-white/80">
                      Drag to reorder
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {mockupTimeline.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-3"
                      >
                        <div className="space-y-1 text-left">
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-white/70">{item.meta}</p>
                        </div>
                        <span
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                            toneStyles[item.tone]
                          }`}
                        >
                          {item.tone === "emerald"
                            ? "Pinned"
                            : item.tone === "blue"
                            ? "Reminder"
                            : "Due soon"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel-soft rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      Filters
                    </p>
                    <span className="text-xs text-[#5EA2EF]">One tap</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mockupFilters.map((filter) => (
                      <span
                        key={filter}
                        className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/80 hover:border-[#5EA2EF]/50 hover:text-white transition-colors"
                      >
                        #{filter}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-panel-soft rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                      LifeLog overview
                    </p>
                    <p className="text-lg font-semibold text-white mt-1">
                      Dashboard snapshot
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mockupInsights.map((insight) => (
                      <div
                        key={insight.label}
                        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-left"
                      >
                        <p className="text-[11px] uppercase tracking-wide text-white/60">
                          {insight.label}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {insight.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-5 gap-3">
                  {mockupBars.map((height, idx) => (
                    <div
                      key={height + idx}
                      className="flex flex-col justify-end gap-2"
                    >
                      <div className="h-28 w-full rounded-xl bg-white/5 border border-white/5 flex items-end p-1">
                        <div
                          className="w-full rounded-lg bg-gradient-to-b from-[#5EA2EF] to-[#0072F5]"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-white/60 text-center">
                        Day {idx + 1}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                    <p className="text-xs text-white/70">Next reminder</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      6:30p – Outline LifeLog updates
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                    <p className="text-xs text-white/70">Last modified</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      Pinned notes refreshed 2m ago
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                    <p className="text-xs text-white/70">Current streak</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      12 days in flow
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-20 space-y-7"
        >
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              Highlights
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mt-1">
              Built to keep you organized and quick
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 text-left md:flex md:flex-wrap md:gap-6 md:justify-center">
            {highlights.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 * idx }}
                className="glass-panel-soft rounded-2xl p-5 border border-white/10 hover:-translate-y-1 transition-all hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)] text-slate-900 dark:text-white"
              >
                <div className="flex items-start gap-4">
                  <span className="glow-icon w-12 h-12 flex items-center justify-center shrink-0">
                    <Image src={item.icon} alt={item.title} className="w-7 h-7 object-contain" />
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-white/75 leading-relaxed">
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
          className="mt-20 glass-panel rounded-3xl p-8 border border-white/15 text-left"
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr] items-start">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
                Why LifeLog
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-white">
                Run your day with clarity, not clutter.
              </h2>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                A balanced workspace that lets you capture ideas, set intent,
                and see exactly what needs attention next. No loud colors, no
                card overload—just a calm, modern surface with the right
                signals.
              </p>
              <ul className="space-y-2 text-sm text-white/80">
                {[
                  "Smart tags, pins, and due times keep priorities visible everywhere.",
                  "Workspace adapts to light and dark without sacrificing contrast.",
                  "Built for speed: instant search, drag filters, and real-time sync.",
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                    <span className="mt-0.5 text-[#5EA2EF]">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 flex-wrap">
                <Link to="/home">
                  <Button
                    size="sm"
                    color="primary"
                    className="px-5 shadow-[0_15px_40px_rgba(0,114,245,0.35)]"
                  >
                    Jump in
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/signup">
                    <Button
                      size="sm"
                      variant="flat"
                      className="px-5 glass-chip border border-white/20 text-white/90"
                    >
                      Create account
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="glass-panel-soft rounded-2xl p-5 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="glow-icon w-11 h-11 flex items-center justify-center text-lg">
                      {pillar.accent}
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      {pillar.title}
                    </h3>
                  </div>
                  <ul className="space-y-2 text-sm text-white/75">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex gap-2 items-start">
                        <span className="mt-0.5 text-[#5EA2EF]">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
          className="mt-10 w-full overflow-hidden"
        >
          <div className="ticker flex gap-3 text-sm text-white/80">
            {[
              "🌟 Tag & drag to focus fast",
              "⚡ Instant search + pinning",
              "🎨 Rich text & colors",
              "☁️ Secure auth + real-time sync",
              "🌓 Dark & light themes",
            ].map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full glass-chip border border-white/10 whitespace-nowrap"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Content;

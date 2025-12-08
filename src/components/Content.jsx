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
      "Real-time sync keeps every device aligned.",
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

  return (
    <>
      <div
        className="relative overflow-hidden text-slate-900 dark:text-white min-h-screen flex flex-col items-center justify-start px-4 pt-12 md:pt-16 pb-12"
        style={{ background: "transparent" }}
      >
        <div className="absolute inset-0 pointer-events-none" />

        <div className="relative max-w-6xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6"
          >
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-600 dark:text-slate-200/80 px-4 py-2 rounded-full bg-white/80 border border-slate-200/70 shadow-sm backdrop-blur dark:bg-white/5 dark:border-white/10">
              Your life, beautifully logged
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-b from-[#5EA2EF] to-[#0072F5] bg-clip-text text-transparent drop-shadow">
                LifeLog
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-200/90 max-w-2xl mx-auto">
              A playful, powerful space to capture thoughts, build routines, and
              celebrate progress—day after day.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/home">
                <Button
                  color="primary"
                  className="px-5 py-3 text-base font-semibold shadow-lg shadow-[#0072F5]/30 transition-transform hover:-translate-y-0.5 hover:scale-[1.02]"
                >
                  {primaryCtaLabel}
                </Button>
              </Link>
              <Link to={secondaryCta.to}>
                <Button
                  className="px-5 py-3 text-base font-semibold border border-slate-300 text-slate-900 bg-white/85 shadow-md shadow-slate-200/60 transition-transform hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white dark:bg-white/10 dark:border-white/15 dark:text-white dark:shadow-slate-900/30"
                  variant="flat"
                >
                  {secondaryCta.label}
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5">
                No clutter. Your notes, synced and secure.
              </span>
              <span className="px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5">
                Fast search, drag filters, instant pinning.
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {[
                { label: "Avg. time saved", value: "12 min", desc: "per entry with quick filters" },
                { label: "Notes organized", value: "4.8k+", desc: "kept tidy with tags & pins" },
                { label: "Focus streaks", value: "94%", desc: "stay engaged with daily logging" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-2xl bg-white/85 border border-slate-200/80 shadow-md shadow-slate-200/60 dark:bg-white/5 dark:border-white/10 dark:shadow-black/20"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{item.label}</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">{item.value}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mt-4 rounded-full bg-white/85 border border-slate-200/70 px-3 py-2 inline-flex items-center gap-2 text-xs text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-100/80 cursor-default shadow-sm dark:shadow-black/20"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-time sync • Drag a tag to filter • Dark/Light ready
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
            className="mt-12 grid gap-4 md:grid-cols-3 text-left"
          >
            {highlights.map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-2xl bg-white/85 border border-slate-200/80 shadow-md shadow-slate-200/50 hover:shadow-lg hover:-translate-y-1 transition-all dark:bg-white/5 dark:border-white/10 dark:shadow-black/20"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-slate-900/5 border border-slate-200/70 dark:bg-white/10 dark:border-white/10">
                    <Image src={item.icon} alt={item.title} className="w-7 h-7" />
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h2>
                    <p className="text-sm text-slate-700 dark:text-slate-200/85 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
            className="mt-14 grid gap-8 lg:grid-cols-[1.1fr,0.9fr] text-left items-start"
          >
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-200/70">Why LifeLog</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
                Run your day with clarity, not clutter.
              </h2>
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-200/85 leading-relaxed">
                A balanced workspace that lets you capture ideas, set intent, and see exactly what needs attention next.
                No loud colors, no card overload—just a calm, modern surface with the right signals.
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200/85">
                {[
                  "Smart tags, pins, and due times keep priorities visible everywhere.",
                  "Workspace adapts to light and dark without sacrificing contrast.",
                  "Built for speed: instant search, drag filters, and real-time sync.",
                ].map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                    <span className="mt-0.5 text-[#0072F5]">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 flex-wrap">
                <Link to="/home">
                  <Button size="sm" color="primary" className="px-5 shadow-lg shadow-[#0072F5]/30">
                    Jump in
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/signup">
                    <Button
                      size="sm"
                      variant="flat"
                      className="px-5 border border-slate-300 text-slate-900 bg-white/90 shadow-sm shadow-slate-200/60 hover:bg-white dark:bg-white/10 dark:border-white/20 dark:text-white dark:shadow-black/20"
                    >
                      Create account
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="p-5 rounded-2xl bg-white/85 border border-slate-200/80 shadow-md shadow-slate-200/50 dark:bg-white/5 dark:border-white/10 dark:shadow-black/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{pillar.accent}</span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{pillar.title}</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200/85">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex gap-2 items-start">
                        <span className="mt-0.5 text-emerald-500">●</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
          className="mt-10 w-full overflow-hidden"
        >
          <div className="ticker flex gap-3 text-sm text-slate-700 dark:text-white/80">
            {[
              "🌟 Tag & drag to focus fast",
              "⚡ Instant search + pinning",
              "🎨 Rich text & colors",
              "☁️ Secure auth + real-time sync",
              "🌓 Dark & light themes",
            ].map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full bg-white/85 border border-slate-200/80 text-slate-700 backdrop-blur-sm whitespace-nowrap hover:bg-white dark:bg-white/10 dark:border-white/10 dark:text-white/80 hover:dark:bg-white/15 transition-colors shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </>
  );
}

export default Content;

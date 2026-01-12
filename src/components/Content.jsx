import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  Chip,
  Image,
} from "@heroui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/20/solid";
import {
  BellAlertIcon,
  PencilSquareIcon,
  RocketLaunchIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
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

const socialProof = {
  stat: "12,000+ planners",
  roles: "Ops, product, and design teams",
  brands: ["Northwind", "Harbor", "Fieldnote", "Mariner", "Sierra"],
  avatars: [
    { name: "Ava R.", src: "https://i.pravatar.cc/80?img=12" },
    { name: "Miles K.", src: "https://i.pravatar.cc/80?img=22" },
    { name: "Priya S.", src: "https://i.pravatar.cc/80?img=32" },
    { name: "Noah T.", src: "https://i.pravatar.cc/80?img=42" },
    { name: "Elena D.", src: "https://i.pravatar.cc/80?img=52" },
  ],
};

const testimonials = [
  {
    quote:
      "LifeLog keeps our weekly planning in one place. Tags and pins make priorities obvious without extra meetings.",
    name: "Ava R.",
    role: "Operations",
    company: "Northwind",
    src: "https://i.pravatar.cc/120?img=23",
  },
  {
    quote:
      "The dashboard view makes it easy to see what is due, and reminders are gentle enough to stay helpful.",
    name: "Miles K.",
    role: "Founder",
    company: "Harbor",
    src: "https://i.pravatar.cc/120?img=13",
  },
  {
    quote:
      "We replaced two tools with LifeLog. The clean editor and quick search save time every day.",
    name: "Priya S.",
    role: "Design lead",
    company: "Fieldnote",
    src: "https://i.pravatar.cc/120?img=33",
  },
];

const previewCallouts = [
  {
    title: "Pinned priorities",
    body: "Top notes stay visible",
    position: "top-6 left-6",
    align: "left",
  },
  {
    title: "Tags + colors",
    body: "Scan themes faster",
    position: "bottom-8 left-10",
    align: "left",
  },
  {
    title: "Due reminders",
    body: "Know what is next",
    position: "top-10 right-6",
    align: "right",
  },
];

const howItWorks = [
  {
    title: "Capture in seconds",
    body: "Save notes, tasks, and ideas the moment they show up.",
    icon: PencilSquareIcon,
    points: ["Quick add with rich formatting", "Checklists, links, and images"],
  },
  {
    title: "Organize with intent",
    body: "Group what matters using tags, colors, and pins.",
    icon: Squares2X2Icon,
    points: ["Smart folders and fast search", "Drag to reorder priorities"],
  },
  {
    title: "Act on what's next",
    body: "Set due dates and reminders so nothing slips.",
    icon: BellAlertIcon,
    points: ["Due dates on any note", "Browser reminders at the right time"],
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

const faqItems = [
  {
    id: "what-is",
    question: "What is LifeLog?",
    answer:
      "LifeLog is your all-in-one place for daily notes, quick tasks, and gentle reminders. It brings your ideas, priorities, and due dates into a single, simple dashboard so you can plan your day without bouncing between apps.",
  },
  {
    id: "free-plan",
    question: "Is LifeLog free?",
    answer:
      "Yes. The Free plan is available forever and stores your notes locally on one device. If you want cloud sync, sharing, and automatic backups, the Premium plan adds those extras while keeping the same clean, fast experience.",
  },
  {
    id: "reminders",
    question: "How do reminders work?",
    answer:
      "Add a due date to any note and choose when you want to be reminded. LifeLog will send a browser notification at the right time, so you stay on track without needing to keep the app open.",
  },
  {
    id: "offline",
    question: "Can I use LifeLog offline?",
    answer:
      "Absolutely. Local notes work offline by default, which makes LifeLog great for commuting or focused sessions without Wi-Fi. Premium also keeps an offline cache and syncs your changes automatically once you are back online.",
  },
  {
    id: "privacy",
    question: "How private are my notes?",
    answer:
      "Your notes stay on your device by default, which keeps things private and lightweight. If you choose Premium, your notes are synced to the cloud so you can access them anywhere, and you stay in control of what you share.",
  },
];

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
    ? { label: "Open your dashboard", to: "/app" }
    : { label: "Start free — no setup", to: "/auth?mode=signup" };

  const secondaryCta = isAuthenticated
    ? { label: "View profile", to: "/profile" }
    : { label: "Sign in", to: "/auth?mode=signin" };

  const finalCta = isAuthenticated
    ? { label: "Return to dashboard", to: "/app" }
    : { label: "Create your dashboard", to: "/auth?mode=signup" };

  return (
    <div className="relative overflow-hidden text-slate-900 dark:text-white min-h-screen flex flex-col items-center px-4 pt-14 md:pt-16 pb-32">
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
                : "Start planning in seconds"}
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
            Get your day organized with{" "}
            <span className="bg-gradient-to-b from-[#5EA2EF] to-[#0072F5] bg-clip-text text-transparent drop-shadow">
              LifeLog
            </span>
            .
          </h1>
          <p className="text-sm md:text-base text-slate-700 dark:text-white/80 max-w-2xl mx-auto">
            {isAuthenticated
              ? "Your notes, tags, and reminders are in one calm view so you can see what is next instantly."
              : "Capture notes, tag them, and set reminders in one calm dashboard so you always know what is next."}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to={primaryCta.to}>
              <Button
                color="primary"
                className="px-6 py-3 text-base font-semibold shadow-[0_15px_40px_rgba(0,114,245,0.35)] hover:-translate-y-0.5 hover:scale-[1.02] transition-transform"
              >
                {primaryCta.label}
              </Button>
            </Link>
            <Link to={secondaryCta.to}>
              <Button
                variant="light"
                className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
              >
                {secondaryCta.label}
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 dark:text-white/75">
            <span className="px-3 py-1 rounded-full glass-chip border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-white/80">
              Free forever on one device. Upgrade for sync anytime.
            </span>
            <span className="px-3 py-1 rounded-full glass-chip border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-white/80">
              See priorities, tags, and due dates at a glance.
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
          <div className="relative mx-auto w-full max-w-6xl xl:max-w-[68rem] 2xl:max-w-[72rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-10 rounded-[40px] bg-gradient-to-r from-[#5EA2EF]/25 via-[#0072F5]/20 to-transparent blur-3xl opacity-70"
            />
            <div className="pointer-events-none absolute inset-0 hidden md:block">
              {previewCallouts.map((callout) => (
                <div
                  key={callout.title}
                  className={`absolute ${
                    callout.position
                  } flex items-center gap-3 ${
                    callout.align === "right"
                      ? "flex-row-reverse text-right"
                      : ""
                  }`}
                >
                  <span className="h-px w-12 bg-slate-300/70 dark:bg-white/40" />
                  <div className="rounded-2xl border border-slate-200/80 dark:border-white/20 bg-white/80 dark:bg-black/40 px-3 py-2 text-xs text-slate-700 dark:text-white/80 shadow-[0_12px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/70">
                      {callout.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-700 dark:text-white/70">
                      {callout.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-700 dark:text-white/70 md:hidden">
            {previewCallouts.map((callout) => (
              <span
                key={callout.title}
                className="px-3 py-1 rounded-full glass-chip border border-slate-200/70 dark:border-white/10"
              >
                {callout.title}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="text-center mb-8 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              Trusted by planners
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              {socialProof.roles} rely on LifeLog to keep priorities clear.
            </h2>
            <p className="text-sm text-slate-700 dark:text-white/70 max-w-2xl mx-auto">
              Early access feedback from real planners and small teams.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 dark:text-white/70">
              <AvatarGroup size="sm" isBordered>
                {socialProof.avatars.map((avatar) => (
                  <Avatar
                    key={avatar.name}
                    name={avatar.name}
                    src={avatar.src}
                    className="bg-white/80 text-slate-900 dark:bg-white/10 dark:text-white"
                  />
                ))}
              </AvatarGroup>
              <span className="text-xs text-slate-700 dark:text-white/70">
                {socialProof.stat} already planning with LifeLog.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 dark:text-white/75">
            {socialProof.brands.map((brand) => (
              <span
                key={brand}
                className="px-4 py-2 rounded-full glass-chip border border-slate-200/70 dark:border-white/10 uppercase tracking-[0.25em] text-[10px]"
              >
                {brand}
              </span>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            {testimonials.map((item, idx) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.05 * idx,
                }}
                className="glass-panel-soft relative overflow-hidden rounded-2xl p-6 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-[#5EA2EF]/20 blur-3xl opacity-70"
                />
                <div className="relative h-full flex flex-col">
                  <p className="text-sm text-slate-700 dark:text-white/75">
                    "{item.quote}"
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <Avatar
                      name={item.name}
                      src={item.src}
                      className="w-11 h-11 text-sm bg-white/80 text-slate-900 dark:bg-white/10 dark:text-white border border-slate-200/80 dark:border-white/20"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-white/60">
                        {item.role} - {item.company}
                      </p>
                    </div>
                    <span className="glow-icon h-10 w-10 flex items-center justify-center shrink-0">
                      <SparklesIcon className="h-5 w-5 text-[#0072F5] dark:text-[#5EA2EF]" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
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
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.05 * idx,
                }}
                className="group glass-panel-soft relative overflow-hidden rounded-2xl p-6 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white transition-all hover:border-slate-300/80 dark:hover:border-white/20 hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)]"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-[#5EA2EF]/20 blur-3xl opacity-70 transition-opacity group-hover:opacity-90"
                />
                <div className="relative space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200/80 dark:border-white/20 bg-white/70 dark:bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/70">
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
                      <Image
                        src={item.icon}
                        alt={item.title}
                        className="w-6 h-6 object-contain"
                      />
                    </span>
                  </div>
                  <div className="h-px w-full bg-slate-200/70 dark:bg-white/10" />
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-white/75">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/22 border border-[#0072F5]/20 dark:bg-[#0072F5]/20 dark:border-[#0072F5]/30">
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
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="text-center mb-7 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              A simple flow for busy days.
            </h2>
            <p className="text-sm text-slate-700 dark:text-white/70 max-w-2xl mx-auto">
              Capture, organize, and act without switching tools.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
            {howItWorks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: 0.05 * idx,
                  }}
                  className="group glass-panel-soft relative overflow-hidden rounded-2xl p-6 border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white transition-all hover:border-slate-300/80 dark:hover:border-white/20 hover:shadow-[0_25px_60px_rgba(0,0,0,0.45)]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-[#5EA2EF]/20 blur-3xl opacity-70 transition-opacity group-hover:opacity-90"
                  />
                  <div className="relative space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <span className="inline-flex items-center rounded-full border border-slate-200/80 dark:border-white/20 bg-white/70 dark:bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/70">
                          Step {idx + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-white/75">
                          {item.body}
                        </p>
                      </div>
                      <span className="glow-icon w-12 h-12 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-[#0072F5] dark:text-[#5EA2EF]" />
                      </span>
                    </div>
                    <div className="h-px w-full bg-slate-200/70 dark:bg-white/10" />
                    <ul className="space-y-2 text-sm text-slate-700 dark:text-white/75">
                      {item.points.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/22 border border-[#0072F5]/20 dark:bg-[#0072F5]/20 dark:border-[#0072F5]/30">
                            <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl p-8 shadow-[0_25px_70px_rgba(0,0,0,0.18)]">
            <div className="text-center space-y-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/70">
                Pricing
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
                Free forever. Upgrade for sync.
              </h2>
              <p className="text-sm md:text-base text-slate-700 dark:text-white/75 max-w-2xl mx-auto">
                Start free on one device, or go Premium for cloud sync and
                backups.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Card className="relative h-full overflow-hidden border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.18)]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                >
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
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/22 border border-[#0072F5]/20 dark:bg-[#0072F5]/20 dark:border-[#0072F5]/30">
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
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                  >
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
                          <span className="pb-1 text-sm text-white/70">
                            /mo
                          </span>
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="text-center mb-8 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/65">
              FAQ
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              Questions, answered.
            </h2>
            <p className="text-sm text-slate-700 dark:text-white/70 max-w-2xl mx-auto">
              Quick details on plans, privacy, and reminders.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-3xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-r from-[#5EA2EF]/20 via-[#0072F5]/15 to-transparent blur-3xl opacity-70"
            />
            <div className="relative glass-panel-soft rounded-3xl border border-slate-200/70 dark:border-white/10 p-4 md:p-6 text-left">
              <Accordion
                variant="splitted"
                selectionMode="multiple"
                defaultExpandedKeys={["what-is"]}
                showDivider={false}
                className="gap-3"
                itemClasses={{
                  base: "rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-[0_16px_40px_rgba(15,32,65,0.12)] backdrop-blur-xl",
                  trigger: "px-4 py-4 gap-4",
                  title:
                    "text-sm md:text-base font-semibold text-slate-900 dark:text-white",
                  content:
                    "px-4 pb-4 pt-0 text-sm text-slate-700 dark:text-white/70",
                  indicator: "text-[#0072F5] dark:text-[#5EA2EF]",
                }}
              >
                {faqItems.map((item) => (
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-16"
        >
          <div className="glass-panel-soft relative overflow-hidden rounded-[28px] border border-slate-200/70 dark:border-white/10 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-[#5EA2EF]/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-[#0072F5]/15 blur-3xl"
            />
            <div className="relative flex flex-col items-center text-center">
              <span className="inline-flex items-center rounded-full border border-slate-200/80 dark:border-white/20 bg-white/70 dark:bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-600 dark:text-white/70">
                Ready to start
              </span>
              <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
                Make today clear, then keep it that way.
              </h2>
              <p className="mt-2 text-sm md:text-base text-slate-700 dark:text-white/75 max-w-2xl">
                Start free and keep priorities visible with tags, pins, and
                reminders.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-slate-700 dark:text-white/75 sm:grid-cols-2">
                <li className="flex items-start justify-center gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/22 border border-[#0072F5]/20 dark:bg-[#0072F5]/20 dark:border-[#0072F5]/30">
                    <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                  </span>
                  <span>One dashboard for notes, tasks, and routines.</span>
                </li>
                <li className="flex items-start justify-center gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/22 border border-[#0072F5]/20 dark:bg-[#0072F5]/20 dark:border-[#0072F5]/30">
                    <CheckIcon className="h-3.5 w-3.5 text-[#0072F5] dark:text-[#5EA2EF]" />
                  </span>
                  <span>Pin priorities and set due dates in seconds.</span>
                </li>
                <li className="flex items-start justify-center gap-3 sm:col-span-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0072F5]/22 border border-[#0072F5]/20 dark:bg-[#0072F5]/20 dark:border-[#0072F5]/30">
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
                  ? "You're signed in. Jump back into your dashboard."
                  : "Free forever on one device. Upgrade anytime."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Content;

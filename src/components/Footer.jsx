import { Link } from "react-router-dom";
import { Image } from "@heroui/react";
import Logo from "../assets/logo2.png";

const Footer = () => {
  return (
    <footer className="w-full mt-16 px-4 md:px-6 pb-12 text-slate-200 dark:text-white/80">
      <div className="max-w-6xl mx-auto rounded-2xl footer-panel px-5 md:px-8 py-9 shadow-[0_25px_60px_rgba(0,0,0,0.25)] relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(circle at 22% 20%, rgba(94,162,239,0.24), transparent 42%), radial-gradient(circle at 82% 12%, rgba(0,114,245,0.18), transparent 46%)",
          }}
        />
        <div className="relative flex flex-col gap-10">
          <div className="grid gap-10 grid-cols-2 lg:grid-cols-[1.1fr,0.9fr,0.9fr] items-start">
            <div className="space-y-4 flex flex-col items-center sm:items-start text-center sm:text-left max-w-xl mx-auto sm:mx-0 col-span-2 lg:col-span-1">
              <Image
                src={Logo}
                alt="LifeLog"
                className="w-[120px] sm:w-[140px] mx-auto sm:mx-0 dark:invert transition-all"
              />
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] footer-muted px-3 py-1 rounded-full border border-white/15 bg-white/5">
                Calm workspace
              </span>
              <p className="text-sm footer-muted leading-relaxed">
                Calm, consistent space to capture your notes, routines, and
                wins—designed to stay out of your way.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] uppercase tracking-[0.2em] footer-muted">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5">
                  Minimal distraction
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5">
                  Sync across devices
                </span>
              </div>
            </div>

            <div className="space-y-4 text-center sm:text-left col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] footer-muted">
                Navigate
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 justify-items-center sm:justify-items-start text-sm font-medium">
                <Link
                  to="/"
                  className="hover:text-[#5EA2EF] transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/profile"
                  className="hover:text-[#5EA2EF] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="hover:text-[#5EA2EF] transition-colors"
                >
                  Profile
                </Link>
                <Link
                  to="/signup"
                  className="hover:text-[#5EA2EF] transition-colors"
                >
                  Get started
                </Link>
              </div>
            </div>

            <div className="space-y-4 text-center sm:text-left col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] footer-muted">
                Help
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 justify-items-center sm:justify-items-start text-sm font-medium">
                <a
                  href="mailto:support@lifelog.app"
                  className="hover:text-[#5EA2EF] transition-colors"
                >
                  Support
                </a>
                <Link
                  to="/terms"
                  className="hover:text-[#5EA2EF] transition-colors"
                >
                  Terms
                </Link>
                <Link
                  to="/privacy"
                  className="hover:text-[#5EA2EF] transition-colors"
                >
                  Privacy
                </Link>
              </div>
              <p className="text-xs footer-muted">
                Thoughtful support for calm workflows.
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs footer-muted">
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 uppercase tracking-[0.18em]">
                Built for focus
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 uppercase tracking-[0.18em]">
                Light & Dark
              </span>
            </div>
            <div className="text-center sm:text-right">
              © {new Date().getFullYear()} LifeLog. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

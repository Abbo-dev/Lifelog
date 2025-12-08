import { Link } from "react-router-dom";
import { Image } from "@heroui/react";
import Logo from "../assets/logo2.png";

const Footer = () => {
  return (
    <footer className="w-full mt-16 px-4 md:px-6 pb-12 text-slate-200 dark:text-white/80">
      <div className="max-w-6xl mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 md:px-8 py-9 glass-panel-soft shadow-[0_25px_60px_rgba(0,0,0,0.25)] relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(circle at 22% 20%, rgba(94,162,239,0.24), transparent 42%), radial-gradient(circle at 82% 12%, rgba(0,114,245,0.18), transparent 46%)",
          }}
        />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr,0.9fr,0.9fr] md:grid-cols-[1.1fr,0.9fr] md:auto-rows-fr items-start">
          <div className="space-y-3 text-center md:text-left max-w-xl mx-auto md:mx-0">
            <Image
              src={Logo}
              alt="LifeLog"
              className="w-[120px] mx-auto md:mx-0 dark:invert transition-all"
            />
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-200/70 dark:text-white/60 px-3 py-1 rounded-full border border-white/15 bg-white/5">
              Calm workspace
            </span>
            <p className="text-sm text-slate-200/80 dark:text-white/70 leading-relaxed">
              Calm, consistent space to capture your notes, routines, and
              wins—designed to stay out of your way.
            </p>
          </div>

          <div className="space-y-3 text-center md:text-left ml-7 pl-10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-200/70 dark:text-white/60">
              Navigate
            </p>
            <div className="flex flex-wrap md:flex-col gap-3 justify-center md:justify-start text-sm font-medium">
              <Link to="/" className="hover:text-[#5EA2EF] transition-colors">
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

          <div className="space-y-3 text-center md:text-left ml-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-200/70 dark:text-white/60">
              Help
            </p>
            <div className="flex flex-wrap md:flex-col gap-3 justify-center md:justify-start text-sm font-medium">
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
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-center text-slate-200/70 dark:text-white/60">
          © {new Date().getFullYear()} LifeLog. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

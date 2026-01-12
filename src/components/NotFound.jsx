import { Button } from "@heroui/react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="relative min-h-screen w-full px-4 md:px-6 pb-16 pt-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#0072F5]/18 to-[#5EA2EF]/12 blur-3xl" />
        <div className="absolute -bottom-32 right-[-120px] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#9353D3]/12 to-[#0072F5]/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.18)] p-8 md:p-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 dark:text-white/70">
            404
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Page not found
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-700 dark:text-white/75 max-w-xl mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or was moved.
          </p>

          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/home">
              <Button
                color="primary"
                className="px-5 shadow-[0_15px_40px_rgba(0,114,245,0.35)]"
              >
                Go to landing
              </Button>
            </Link>
            <Link to="/app">
              <Button
                variant="flat"
                className="px-5 glass-chip border border-white/20 text-slate-900 dark:text-white"
              >
                Go to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

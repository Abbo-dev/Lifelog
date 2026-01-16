export const TOAST_CLASSNAMES = {
  base:
    "relative rounded-2xl glass-panel-soft !p-5 pb-6 pr-12 shadow-[0_18px_45px_rgba(15,32,65,0.18)]",
  content: "gap-3 items-start",
  wrapper: "gap-0.5",
  title: "text-sm font-semibold tracking-tight text-slate-900 dark:text-white",
  description: "text-xs text-slate-600 dark:text-gray-200",
  icon: "!w-5 !h-5 text-[#0072F5]",
  closeButton:
    "!opacity-100 !pointer-events-auto !absolute !right-1 !top-1 !z-20 !w-5 !h-5 !p-0 bg-transparent !border-0 shadow-none",
  closeIcon:
    "!rounded-none !border-0 !bg-transparent !p-0 w-4 h-4 text-slate-500 hover:text-slate-800 dark:text-gray-300 dark:hover:text-white",
  progressTrack:
    "absolute inset-x-3 bottom-2 top-auto h-1 rounded-full bg-white/60 dark:bg-white/10 overflow-hidden",
  progressIndicator:
    "h-full rounded-full bg-gradient-to-r from-[#5EA2EF] to-[#0072F5]",
};

export const PREMIUM_TOAST_CLASSNAMES = {
  ...TOAST_CLASSNAMES,
  base:
    "relative rounded-2xl glass-panel !p-5 pb-6 pr-12 shadow-[0_20px_55px_rgba(15,32,65,0.22)]",
  icon: "!w-5 !h-5 text-[#5EA2EF] drop-shadow-[0_0_10px_rgba(94,162,239,0.55)]",
};

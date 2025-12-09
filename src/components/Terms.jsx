const sections = [
  {
    title: "Use of LifeLog",
    body: "Create, edit, and store your personal notes. Keep it legal, respectful, and free of abuse or spam.",
  },
  {
    title: "Your data",
    body: "You own your content. We store it securely, do not sell it, and provide sync/backups for continuity.",
  },
  {
    title: "Security",
    body: "Use a strong password and protect your credentials. Report suspicious activity so we can help fast.",
  },
  {
    title: "Availability",
    body: "We aim for high uptime. If maintenance or incidents occur, we’ll communicate status and next steps.",
  },
  {
    title: "Changes",
    body: "Terms may evolve. Continued use means you accept the latest version; we’ll highlight meaningful updates.",
  },
];

function Terms() {
  return (
    <div className="profile-shell min-h-screen text-slate-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-14 space-y-8">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">
            Legal
          </p>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-slate-600 dark:text-gray-300 max-w-3xl">
            The essentials for using LifeLog responsibly—how you can use the app, what we safeguard, and what to expect from us.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((item) => (
            <div key={item.title} className="profile-surface rounded-2xl p-4 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-gray-300">
                {item.title}
              </p>
              <p className="text-sm text-slate-700 dark:text-gray-200 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="profile-surface rounded-2xl p-4 md:p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-gray-300">Questions</p>
          <p className="text-sm text-slate-700 dark:text-gray-200 leading-relaxed">
            Need clarity or have a concern? Email us at <span className="font-semibold">support@lifelog.app</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Terms;

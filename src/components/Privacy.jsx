const privacySections = [
  {
    title: "Data we collect",
    body: "Account info (email, name), the notes you create, and light usage logs to keep things reliable.",
  },
  {
    title: "How we use it",
    body: "Sync your notes across devices, secure your account, improve stability, and provide support.",
  },
  {
    title: "Storage & security",
    body: "Data lives in encrypted databases. Access is protected with authentication and role-based controls.",
  },
  {
    title: "Sharing",
    body: "We never sell your data. Third parties are limited to hosting, analytics, and notifications as needed.",
  },
  {
    title: "Your controls",
    body: "Request access, export, or deletion anytime—just email support@lifelog.app and we’ll help quickly.",
  },
  {
    title: "Updates",
    body: "Policies may evolve. We’ll highlight meaningful changes; continued use means you accept the latest.",
  },
];

function Privacy() {
  return (
    <div className="profile-shell min-h-screen text-slate-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-14 space-y-8">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">
            Legal
          </p>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-slate-600 dark:text-gray-300 max-w-3xl">
            Your notes stay yours. We collect only what’s needed to run LifeLog smoothly and protect your account.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {privacySections.map((item) => (
            <div key={item.title} className="profile-surface rounded-2xl p-4 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-gray-300">
                {item.title}
              </p>
              <p className="text-sm text-slate-700 dark:text-gray-200 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="profile-surface rounded-2xl p-4 md:p-5 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-gray-300">Contact</p>
          <p className="text-sm text-slate-700 dark:text-gray-200 leading-relaxed">
            Need an export or deletion? Email <span className="font-semibold">support@lifelog.app</span> with your request.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;

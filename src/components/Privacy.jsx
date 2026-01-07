const privacySections = [
  {
    title: "Scope and applicability",
    body:
      "This Privacy Policy explains how LifeLog collects, uses, and shares information when you use our app or website. It applies to Free and Premium plans and is designed to align with modern privacy laws such as GDPR, UK GDPR, and US state privacy laws.",
  },
  {
    title: "Information you provide",
    body:
      "When you create an account, we collect details like your name, email address, and authentication method. We also store the notes, tasks, tags, and reminders you create, plus any files you upload. If you contact support, we keep your message and related metadata so we can respond.",
  },
  {
    title: "Information collected automatically",
    body:
      "We collect usage and device data such as timestamps, feature usage, IP address, browser or device type, and diagnostic logs. This data helps us keep LifeLog reliable, secure, and fast.",
  },
  {
    title: "How we use information",
    body:
      "We use information to provide the service, sync content across devices, personalize your experience, send service updates, prevent fraud, troubleshoot issues, and comply with legal obligations.",
  },
  {
    title: "Legal bases (EEA/UK)",
    body:
      "If you are in the EEA or UK, we process personal data under legal bases such as contract (to deliver LifeLog), legitimate interests (security and improvement), consent (optional notifications or marketing), and legal obligations.",
  },
  {
    title: "Sharing and disclosures",
    body:
      "We do not sell your data. We share information with trusted service providers for hosting, analytics, notifications, and support; with authorities if required by law; or during a business transfer such as a merger or acquisition.",
  },
  {
    title: "Cookies and local storage",
    body:
      "We use cookies or local storage for authentication, session management, and preferences. You can control cookies in your browser settings, but some features may not work without them.",
  },
  {
    title: "Data retention and deletion",
    body:
      "We keep data while your account is active. You can delete content or your account at any time. Backups and logs are retained only as long as needed for security, recovery, or legal compliance.",
  },
  {
    title: "Your privacy rights",
    body:
      "Depending on where you live, you may have rights to access, correct, delete, export, or restrict the use of your data. You can also withdraw consent for optional processing and lodge a complaint with your local data protection authority.",
  },
  {
    title: "US state privacy rights",
    body:
      "If you are in California or another US state with privacy laws, you may request access, deletion, correction, or information about disclosures. LifeLog does not sell personal data or share it for cross-context behavioral advertising.",
  },
  {
    title: "International transfers and security",
    body:
      "Your data may be processed in countries other than where you live. We use safeguards such as contractual clauses and apply security measures like encryption in transit and access controls to protect your information.",
  },
  {
    title: "Children's privacy",
    body:
      "LifeLog is not intended for children under 13. If you believe a child has provided personal data, contact us and we will delete it.",
  },
  {
    title: "Policy updates",
    body:
      "We may update this policy to reflect changes in the law or our practices. If changes are material, we will provide notice in the app or by email before they take effect.",
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
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Last updated: 2025-03-08
          </p>
          <p className="text-sm text-slate-600 dark:text-gray-300 max-w-3xl">
            This policy describes what we collect, how we use it, and the choices you have under current privacy laws.
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
            To request access, export, correction, or deletion, email{" "}
            <span className="font-semibold">support@lifelog.app</span> and include the email tied to your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacy;

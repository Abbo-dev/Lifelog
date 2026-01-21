const sections = [
  {
    title: "Acceptance of terms",
    body:
      "By accessing or using LifeLog, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service. We may update these Terms and will post the latest version with a revised date.",
  },
  {
    title: "Eligibility and age",
    body:
      "You must be at least 13 to use LifeLog. If you are under the age of majority where you live, you may use the service only with permission from a parent or legal guardian.",
  },
  {
    title: "Account registration and security",
    body:
      "You are responsible for the accuracy of your account information and for safeguarding your credentials. Notify us promptly of any unauthorized access or suspected breach so we can help secure your account.",
  },
  {
    title: "Business information",
    body:
      "LifeLog (legal business name) operates the LifeLog app and website. We provide the service, support, and billing access described in these Terms, and we can be reached at support@lifelog.app for any account, privacy, or billing questions.",
  },
  {
    title: "Your content and permissions",
    body:
      "You retain ownership of the notes and files you create. To operate the service, you grant LifeLog a limited license to host, process, and display your content solely to provide and improve the app.",
  },
  {
    title: "Acceptable use",
    body:
      "Do not use LifeLog for unlawful, harmful, or abusive activity; to spam others; to interfere with or probe the security of the service; or to reverse engineer or attempt to access source code that is not provided to you.",
  },
  {
    title: "Subscriptions and billing",
    body: (
      <>
        Free features are available without charge. If you choose a paid plan,
        payments are handled by Paddle and are subject to their terms. Fees may
        change with advance notice, and taxes may apply. You can cancel at any
        time. See{" "}
        <a
          className="text-[#0072F5] hover:text-[#0052CC] underline"
          href="https://www.paddle.com/legal/terms"
          target="_blank"
          rel="noreferrer"
        >
          Paddle’s Terms
        </a>{" "}
        for details.
      </>
    ),
  },
  {
    title: "Refund policy",
    body: (
      <>
        Refunds are available within 14 days of purchase in accordance with
        Paddle’s refund policy. See{" "}
        <a
          className="text-[#0072F5] hover:text-[#0052CC] underline"
          href="https://www.paddle.com/legal/terms"
          target="_blank"
          rel="noreferrer"
        >
          Paddle’s Terms
        </a>{" "}
        for details.
      </>
    ),
  },
  {
    title: "Third-party services",
    body:
      "LifeLog may integrate with or link to third-party services. We are not responsible for third-party content, availability, or privacy practices, and your use of those services is governed by their terms.",
  },
  {
    title: "Intellectual property",
    body:
      "LifeLog, our branding, and the software (excluding your content) are owned by us and protected by intellectual property laws. We grant you a limited, non-exclusive, revocable right to use the app as intended.",
  },
  {
    title: "Service availability and changes",
    body:
      "We strive for reliable access but do not guarantee uninterrupted service. We may modify or discontinue features, and we may perform maintenance that temporarily limits access.",
  },
  {
    title: "Termination",
    body:
      "You may stop using the service at any time. We may suspend or terminate access if you violate these Terms, if required by law, or to protect the service and its users. Where feasible, we will provide notice.",
  },
  {
    title: "Disclaimers and limitation of liability",
    body:
      "To the maximum extent permitted by law, the service is provided \"as is\" without warranties of any kind. We are not liable for indirect, incidental, or consequential damages. Some jurisdictions do not allow certain limitations, so these may not apply to you.",
  },
  {
    title: "Consumer rights and governing law",
    body:
      "Nothing in these Terms limits non-waivable consumer rights under applicable law. The laws of the jurisdiction where LifeLog is operated will govern these Terms, without regard to conflict of law rules.",
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
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Last updated: 2025-03-08
          </p>
          <p className="text-sm text-slate-600 dark:text-gray-300 max-w-3xl">
            The essentials for using LifeLog responsibly, including account rules, content rights, and limits required by law.
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
            Need clarity or have a concern? Email us at{" "}
            <span className="font-semibold">support@lifelog.app</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Terms;

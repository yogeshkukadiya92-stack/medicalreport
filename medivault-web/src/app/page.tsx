import Link from "next/link";

const features = [
  {
    href: "/dashboard",
    emoji: "📊",
    title: "Health Dashboard",
    desc: "Your health metrics, recent reports, and values that need attention — at a glance.",
    cta: "Open Dashboard",
    color: "bg-teal-600 hover:bg-teal-700",
  },
  {
    href: "/analytics",
    emoji: "📈",
    title: "Analytics & Trends",
    desc: "Track parameters like HbA1c, Vitamin D and cholesterol over time with clear charts.",
    cta: "View Analytics",
    color: "bg-teal-600 hover:bg-teal-700",
  },
  {
    href: "/reports",
    emoji: "📋",
    title: "Medical Reports",
    desc: "Store, search and organize lab reports for your whole family in one secure place.",
    cta: "View Reports",
    color: "bg-cyan-600 hover:bg-cyan-700",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MediVault</h1>
          <p className="text-gray-600">Secure medical report storage & health analytics</p>
        </div>

        <div className="space-y-3 mb-8">
          {features.map((f) => (
            <div
              key={f.href}
              className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm"
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {f.emoji} {f.title}
              </p>
              <p className="text-xs text-gray-600 mb-3">{f.desc}</p>
              <Link href={f.href}>
                <button
                  className={`w-full px-4 py-2.5 text-white rounded-lg text-sm font-medium transition ${f.color}`}
                >
                  {f.cta}
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-900 font-semibold mb-2">🔐 Demo Login</p>
          <p className="text-xs text-blue-700">
            Phone: <code className="bg-white px-2 py-0.5 rounded">+919876543210</code>
            &nbsp;·&nbsp; OTP: <code className="bg-white px-2 py-0.5 rounded">123456</code>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 MediVault · Your health data, private and secure.
        </p>
      </div>
    </main>
  );
}

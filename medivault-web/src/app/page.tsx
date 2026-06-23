import Link from "next/link";

const features = [
  {
    emoji: "🔒",
    title: "Secure Storage",
    desc: "All your family's reports in one safe place — PDFs, lab tests, prescriptions.",
  },
  {
    emoji: "📈",
    title: "Health Trends",
    desc: "Track HbA1c, Vitamin D, cholesterol and see how they change over time.",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Family Profiles",
    desc: "Manage reports for every family member from a single account.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 py-16">
      <div className="max-w-sm w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl shadow-lg mb-5">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MediVault</h1>
          <p className="text-gray-500 text-sm">Your medical records — organised, private, always accessible.</p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <span className="text-2xl">{f.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/login">
          <button className="w-full py-3 bg-teal-600 text-white rounded-xl text-base font-semibold hover:bg-teal-700 transition shadow-md">
            Get Started — Free
          </button>
        </Link>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 MediVault · Your health data, private and secure.
        </p>
      </div>
    </main>
  );
}

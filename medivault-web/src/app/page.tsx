import Link from "next/link";

const features = [
  {
    emoji: "🔒",
    title: "Secure Storage",
    desc: "Family na badha reports ek safe jagya par — PDF, lab tests, prescriptions.",
  },
  {
    emoji: "📈",
    title: "Health Trends",
    desc: "HbA1c, Vitamin D, cholesterol — samay sathe change kevi rite thay che te juo.",
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Family Profiles",
    desc: "Tame ane tmare gharana na badha members na reports ek account thi sambhalo.",
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
          <p className="text-gray-500 text-sm">Tamara medical reports — ek jagya par, hamesha safe.</p>
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
            Shuru Karo — Free
          </button>
        </Link>

        <div className="mt-4 flex gap-3">
          <Link href="/dashboard" className="flex-1">
            <button className="w-full py-2 text-sm text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition">
              Dashboard
            </button>
          </Link>
          <Link href="/reports" className="flex-1">
            <button className="w-full py-2 text-sm text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition">
              Reports
            </button>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 MediVault · Your health data, private and secure.
        </p>
      </div>
    </main>
  );
}

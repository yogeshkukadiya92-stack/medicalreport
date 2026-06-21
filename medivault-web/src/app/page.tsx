import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MediVault</h1>
          <p className="text-gray-600">Medical Report Storage & Analytics</p>
        </div>

        <div className="space-y-3 mb-8">
          <p className="text-sm text-gray-600 text-center">
            ✅ Phase 1-5: Complete & Ready
          </p>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-2">📊 Analytics Dashboard</p>
            <p className="text-xs text-gray-600 mb-3">View your health metrics, trends, and medical history</p>
            <Link href="/dashboard">
              <button className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                View Dashboard
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-2">📈 Analytics</p>
            <p className="text-xs text-gray-600 mb-3">NEW - Complete health analytics with charts and trends</p>
            <Link href="/analytics">
              <button className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition">
                View Analytics
              </button>
            </Link>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-2">📋 Medical Reports</p>
            <p className="text-xs text-gray-600 mb-3">View and manage your medical reports</p>
            <Link href="/reports">
              <button className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition">
                View Reports
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-900 font-medium mb-2">🔐 Dummy Login</p>
          <p className="text-xs text-blue-700">
            Phone: <code className="bg-white px-2 py-1 rounded">+919876543210</code>
          </p>
          <p className="text-xs text-blue-700">
            OTP: <code className="bg-white px-2 py-1 rounded">123456</code>
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center mb-4">📚 Project Documentation</p>
          <div className="grid grid-cols-2 gap-2">
            <a href="https://github.com/yogeshkukadiya92-stack/medicalreport" target="_blank" rel="noopener noreferrer">
              <button className="w-full px-3 py-2 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded border border-teal-200 transition">
                GitHub
              </button>
            </a>
            <Link href="/dashboard">
              <button className="w-full px-3 py-2 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded border border-teal-200 transition">
                Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

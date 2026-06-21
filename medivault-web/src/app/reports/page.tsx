import Link from "next/link";

export default function Reports() {
  const reports = [
    {
      date: "June 20, 2026",
      type: "Blood Test",
      lab: "Apollo Diagnostics",
      parameters: 20,
      abnormal: 3,
      status: "normal",
    },
    {
      date: "June 10, 2026",
      type: "Thyroid Test",
      lab: "Dr. Reddy's Pathology",
      parameters: 3,
      abnormal: 0,
      status: "normal",
    },
    {
      date: "May 18, 2026",
      type: "Lipid Profile",
      lab: "Apollo Diagnostics",
      parameters: 5,
      abnormal: 2,
      status: "normal",
    },
    {
      date: "April 22, 2026",
      type: "Complete Blood Count",
      lab: "Dr. Reddy's Pathology",
      parameters: 10,
      abnormal: 1,
      status: "normal",
    },
  ];

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      "Blood Test": "🧪",
      "Thyroid Test": "🧬",
      "Lipid Profile": "💉",
      "Complete Blood Count": "📊",
    };
    return icons[type] || "📋";
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
            <p className="text-gray-600 mt-1">Your medical test history</p>
          </div>
          <Link href="/dashboard">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              ← Dashboard
            </button>
          </Link>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.map((report, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-teal-300 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getTypeIcon(report.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.type}</h3>
                      <p className="text-sm text-gray-600">{report.date}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Lab</p>
                      <p className="text-sm font-medium text-gray-900">{report.lab}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Parameters</p>
                      <p className="text-sm font-medium text-gray-900">{report.parameters}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Abnormal</p>
                      <p className="text-sm font-medium">
                        <span className={report.abnormal > 0 ? "text-amber-600" : "text-green-600"}>
                          {report.abnormal}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Status</p>
                      <p className="text-sm font-medium text-green-600">✓ Confirmed</p>
                    </div>
                  </div>
                </div>

                <button className="ml-4 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition">
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-900">
            💡 All medical reports are stored securely. You can download, share, or analyze them using the analytics dashboard.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>📄 Total Reports: {reports.length}</p>
        </div>
      </div>
    </main>
  );
}

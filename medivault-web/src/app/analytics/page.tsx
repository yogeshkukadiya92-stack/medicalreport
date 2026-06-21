import Link from "next/link";

export default function Analytics() {
  const parameters = [
    { name: "HbA1c", value: "7.1%", status: "high", trend: "stable" },
    { name: "Blood Sugar", value: "142", status: "high", trend: "stable" },
    { name: "LDL Cholesterol", value: "115", status: "high", trend: "improving" },
    { name: "Vitamin D", value: "18", status: "low", trend: "stable" },
    { name: "Hemoglobin", value: "14.2", status: "normal", trend: "stable" },
    { name: "TSH", value: "2.1", status: "normal", trend: "stable" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-100 text-red-700";
      case "low":
        return "bg-blue-100 text-blue-700";
      case "normal":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return "↑";
      case "declining":
        return "↓";
      default:
        return "→";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Analytics</h1>
            <p className="text-gray-600 mt-1">Track your health metrics and trends</p>
          </div>
          <Link href="/dashboard">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              ← Dashboard
            </button>
          </Link>
        </div>

        {/* Health Score Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Your Health Score</p>
              <h2 className="text-5xl font-bold text-gray-900 mt-2">85</h2>
              <p className="text-gray-600 mt-2">Grade: <span className="font-semibold text-teal-600">B</span></p>
              <p className="text-sm text-gray-500 mt-2">↑ Improving over last 30 days</p>
            </div>
            <div className="w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${(85 / 100) * 565} 565`}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="105" textAnchor="middle" className="text-4xl font-bold fill-gray-900">
                  85
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Parameters Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Your Health Parameters</h3>
            <p className="text-sm text-gray-600 mt-1">Last 90 days</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Parameter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Trend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{param.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{param.value}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(param.status)}`}>
                        {param.status.charAt(0).toUpperCase() + param.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="text-lg">{getTrendIcon(param.trend)}</span>
                        <span className="text-gray-600 text-xs capitalize">{param.trend}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                        View Trend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Values Needing Attention */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Values Needing Attention</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">HbA1c - 7.1%</p>
                <p className="text-sm text-gray-600 mt-1">Slightly elevated. This indicates your average blood glucose over the last 3 months is higher than the target range.</p>
                <p className="text-xs text-amber-700 font-medium mt-2">💡 Consider: Regular exercise, balanced diet, monitor daily glucose</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl">💙</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Vitamin D - 18 ng/mL</p>
                <p className="text-sm text-gray-600 mt-1">Running a bit low. Vitamin D is important for bone health and immunity.</p>
                <p className="text-xs text-blue-700 font-medium mt-2">💡 Consider: Vitamin D supplementation, sunlight exposure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>📊 Analytics Dashboard | All data is dummy for demonstration</p>
        </div>
      </div>
    </main>
  );
}

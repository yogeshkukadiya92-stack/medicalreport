import Link from "next/link";

export default function Dashboard() {
  const stats = [
    { label: "Total Reports", value: "12", icon: "📋", color: "bg-blue-100 text-blue-700" },
    { label: "Last Report", value: "June 20", icon: "📅", color: "bg-teal-100 text-teal-700" },
    { label: "Needs Attention", value: "3", icon: "⚠️", color: "bg-amber-100 text-amber-700" },
    { label: "Health Score", value: "85", icon: "💚", color: "bg-green-100 text-green-700" },
  ];

  const familyMembers = [
    { name: "Rajesh Kumar", relation: "You", status: "Good", score: 85 },
    { name: "Priya Kumar", relation: "Spouse", status: "Excellent", score: 92 },
    { name: "Mohan Kumar", relation: "Parent", status: "Fair", score: 68 },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Health Dashboard</h1>
            <p className="text-gray-600 mt-1">Updated 2 hours ago</p>
          </div>
          <Link href="/">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              ← Home
            </button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-teal-300 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`text-3xl p-3 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/analytics">
            <button className="w-full bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-6 hover:border-teal-400 transition text-left">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">View health trends and charts</p>
            </button>
          </Link>

          <Link href="/reports">
            <button className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 hover:border-blue-400 transition text-left">
              <div className="text-2xl mb-2">📋</div>
              <h3 className="font-semibold text-gray-900">Reports</h3>
              <p className="text-sm text-gray-600 mt-1">View medical reports</p>
            </button>
          </Link>

          <Link href="/">
            <button className="w-full bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-6 hover:border-green-400 transition text-left">
              <div className="text-2xl mb-2">⬆️</div>
              <h3 className="font-semibold text-gray-900">Upload</h3>
              <p className="text-sm text-gray-600 mt-1">Add new medical report</p>
            </button>
          </Link>
        </div>

        {/* Family Health */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Family Health Overview</h2>
          <div className="space-y-3">
            {familyMembers.map((member, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.relation}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{member.status}</p>
                    <p className="text-xs text-gray-600">Score: {member.score}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
                    {member.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>📱 MediVault v1.0 | All phases complete and ready for implementation</p>
        </div>
      </div>
    </main>
  );
}

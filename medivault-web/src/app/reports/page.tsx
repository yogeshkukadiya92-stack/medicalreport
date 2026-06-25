import Link from "next/link";
import { Icon, MobileShell } from "@/components/mobile-shell";

const reports = [
  {
    date: "June 20, 2026",
    type: "Complete Blood Count",
    lab: "Apollo Diagnostics",
    parameters: 20,
    abnormal: 3,
    status: "Needs review",
  },
  {
    date: "June 10, 2026",
    type: "Thyroid Function Test",
    lab: "Dr. Reddy's Pathology",
    parameters: 3,
    abnormal: 0,
    status: "Confirmed",
  },
  {
    date: "May 18, 2026",
    type: "Lipid Profile",
    lab: "Apollo Diagnostics",
    parameters: 5,
    abnormal: 2,
    status: "Watch",
  },
  {
    date: "April 22, 2026",
    type: "Blood Test Report",
    lab: "Metropolis Labs",
    parameters: 10,
    abnormal: 1,
    status: "Confirmed",
  },
];

export default function Reports() {
  return (
    <MobileShell>
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#6f7f7c]">Medical vault</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight text-[#101c1c]">Reports</h1>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230]"
            aria-label="Dashboard"
          >
            <Icon name="home" className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-5 rounded-lg bg-[#102323] p-5 text-white shadow-[0_18px_44px_rgba(16,35,35,0.22)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#a9bfba]">Total reports</p>
              <p className="mt-2 text-[42px] font-black leading-none">12</p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-white/10 text-[#99f0db]">
              <Icon name="shield" className="h-7 w-7" />
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-5 text-[#c5d4d1]">
            Securely stored for Rajesh Kumar and family members.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {["All", "Starred", "Needs review"].map((filter, index) => (
            <button
              key={filter}
              className={`h-10 rounded-lg text-[12px] font-bold ${
                index === 0 ? "bg-[#0a7d6e] text-white" : "border border-[#dce9e5] bg-white text-[#52605d]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {reports.map((report) => (
            <article key={report.type} className="rounded-lg border border-[#e2ebe8] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#f1f6f4] text-[#087766]">
                  <Icon name="reports" className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[15px] font-bold text-[#162523]">{report.type}</h2>
                      <p className="mt-1 truncate text-[12px] text-[#7b8986]">{report.lab}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                        report.abnormal > 0 ? "bg-[#fff0ec] text-[#ba563d]" : "bg-[#eaf9f2] text-[#087766]"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#edf3f1] pt-3 text-[12px]">
                    <div>
                      <p className="text-[#8a9794]">Date</p>
                      <p className="mt-1 font-bold text-[#263432]">{report.date.split(",")[0]}</p>
                    </div>
                    <div>
                      <p className="text-[#8a9794]">Values</p>
                      <p className="mt-1 font-bold text-[#263432]">{report.parameters}</p>
                    </div>
                    <div>
                      <p className="text-[#8a9794]">Flagged</p>
                      <p className="mt-1 font-bold text-[#263432]">{report.abnormal}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

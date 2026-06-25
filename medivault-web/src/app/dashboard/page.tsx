import Link from "next/link";
import { Icon, MobileShell } from "@/components/mobile-shell";
import { SignOutButton } from "@/components/sign-out-button";

const members = [
  { name: "Rajesh", relation: "You", score: 85, active: true },
  { name: "Priya", relation: "Spouse", score: 92, active: false },
  { name: "Mohan", relation: "Parent", score: 68, active: false },
];

const attentionItems = [
  { label: "Vitamin D low", value: "18 ng/mL", tone: "mint", note: "Review supplement plan" },
  { label: "HbA1c high", value: "7.1%", tone: "coral", note: "Track sugar trend" },
];

const recentReports = [
  { title: "Complete Blood Count", lab: "Apollo Diagnostics", date: "20 Jun", status: "Reviewed" },
  { title: "Thyroid Function Test", lab: "Lal Path Labs", date: "10 May", status: "Starred" },
  { title: "Lipid Profile", lab: "Apollo Diagnostics", date: "22 Apr", status: "Normal" },
];

export default function Dashboard() {
  return (
    <MobileShell>
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#6f7f7c]">MediVault</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight tracking-normal text-[#101c1c]">
              Good morning, Rajesh
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notifications"
              className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230] shadow-[0_8px_24px_rgba(20,67,60,0.08)]"
            >
              <Icon name="bell" className="h-5 w-5" />
            </button>
            <SignOutButton />
          </div>
        </div>

        <div id="family" className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {members.map((member) => (
            <button
              key={member.name}
              className={`min-w-[104px] rounded-lg border px-3 py-3 text-left ${
                member.active
                  ? "border-[#0a7d6e] bg-[#0b2b2b] text-white shadow-[0_16px_32px_rgba(11,43,43,0.18)]"
                  : "border-[#dce9e5] bg-white text-[#44524f]"
              }`}
            >
              <span className="block text-[13px] font-bold">{member.name}</span>
              <span className={`mt-1 block text-[11px] ${member.active ? "text-[#aee7d9]" : "text-[#81908d]"}`}>
                {member.relation} - {member.score}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg bg-[#102323] p-5 text-white shadow-[0_22px_52px_rgba(16,35,35,0.28)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#a9bfba]">Health score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[56px] font-black leading-none tracking-normal">85</span>
                <span className="mb-2 text-[13px] font-semibold text-[#99f0db]">Good</span>
              </div>
              <p className="mt-3 max-w-[180px] text-[13px] leading-5 text-[#c5d4d1]">
                2 need attention from your latest reports.
              </p>
            </div>

            <div className="relative grid h-[116px] w-[116px] shrink-0 place-items-center rounded-full bg-[conic-gradient(#38d7b1_0_85%,rgba(255,255,255,0.12)_85%_100%)]">
              <div className="grid h-[86px] w-[86px] place-items-center rounded-full bg-[#102323] text-center">
                <span className="text-[12px] font-semibold text-[#99f0db]">85%</span>
                <span className="-mt-2 text-[10px] text-[#a9bfba]">stable</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Link
              href="/upload"
              className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-lg bg-white/9 text-[11px] font-semibold text-white hover:bg-white/14"
            >
              <Icon name="upload" className="h-5 w-5 text-[#99f0db]" />
              Upload report
            </Link>
            <Link
              href="/reports"
              className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-lg bg-white/9 text-[11px] font-semibold text-white hover:bg-white/14"
            >
              <Icon name="reports" className="h-5 w-5 text-[#99f0db]" />
              Reports
            </Link>
            <Link
              href="/analytics"
              className="flex h-[74px] flex-col items-center justify-center gap-2 rounded-lg bg-white/9 text-[11px] font-semibold text-white hover:bg-white/14"
            >
              <Icon name="analytics" className="h-5 w-5 text-[#99f0db]" />
              Analytics
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#101c1c]">Needs attention</h2>
          <Link href="/analytics" className="text-[13px] font-bold text-[#087766]">
            View all
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {attentionItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border border-[#e2ebe8] bg-white p-4">
              <div
                className={`grid h-11 w-11 place-items-center rounded-lg ${
                  item.tone === "coral" ? "bg-[#fff0ec] text-[#cc6044]" : "bg-[#eaf9f2] text-[#0a7d6e]"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#162523]">{item.label}</p>
                <p className="mt-1 text-[12px] text-[#7b8986]">{item.note}</p>
              </div>
              <div className="text-right text-[13px] font-bold text-[#162523]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#101c1c]">Recent reports</h2>
          <Link href="/reports" className="text-[13px] font-bold text-[#087766]">
            See all
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {recentReports.map((report) => (
            <Link
              key={report.title}
              href="/reports"
              className="flex items-center gap-3 rounded-lg border border-[#e2ebe8] bg-white p-4 hover:border-[#a5dcd0]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#f1f6f4] text-[#087766]">
                <Icon name="reports" className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#162523]">{report.title}</p>
                <p className="mt-1 truncate text-[12px] text-[#7b8986]">
                  {report.lab} - {report.date}
                </p>
              </div>
              <span className="rounded-md bg-[#f1f6f4] px-2.5 py-1 text-[11px] font-bold text-[#52605d]">
                {report.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}

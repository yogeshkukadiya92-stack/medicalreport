import Link from "next/link";
import { Icon, MobileShell } from "@/components/mobile-shell";

const parameters = [
  {
    name: "HbA1c",
    value: "7.1%",
    range: "Target < 5.7",
    status: "High",
    trend: "Stable",
    width: "72%",
    tone: "coral",
  },
  {
    name: "Blood Sugar",
    value: "142",
    range: "70-110 mg/dL",
    status: "High",
    trend: "Stable",
    width: "68%",
    tone: "coral",
  },
  {
    name: "LDL",
    value: "115",
    range: "< 100 mg/dL",
    status: "Watch",
    trend: "Improving",
    width: "54%",
    tone: "mint",
  },
  {
    name: "Vitamin D",
    value: "18",
    range: "30-100 ng/mL",
    status: "Low",
    trend: "Needs care",
    width: "36%",
    tone: "blue",
  },
];

const scoreBars = [44, 58, 52, 66, 61, 74, 70, 85];

function statusStyles(tone: string) {
  if (tone === "coral") return "bg-[#fff0ec] text-[#ba563d]";
  if (tone === "blue") return "bg-[#eef5ff] text-[#4167a8]";
  return "bg-[#eaf9f2] text-[#087766]";
}

function barColor(tone: string) {
  if (tone === "coral") return "bg-[#ec795c]";
  if (tone === "blue") return "bg-[#5c83c9]";
  return "bg-[#0a7d6e]";
}

export default function Analytics() {
  return (
    <MobileShell>
      <section className="px-5 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#087766]">Health intelligence</p>
            <h1 className="mt-1 text-[26px] font-black leading-tight text-[#101c1c]">Analytics</h1>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230] shadow-[0_8px_24px_rgba(20,67,60,0.08)]"
            aria-label="Dashboard"
          >
            <Icon name="home" className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-[#dce9e5] bg-white p-1">
          {["90 days", "6 months", "1 year"].map((label, index) => (
            <button
              key={label}
              className={`h-9 rounded-md text-[12px] font-bold ${
                index === 0 ? "bg-[#102323] text-white shadow-[0_8px_18px_rgba(16,35,35,0.18)]" : "text-[#65716f]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg bg-[#102323] p-5 text-white shadow-[0_24px_54px_rgba(16,35,35,0.28)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#a9bfba]">Overall score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[56px] font-black leading-none">85</span>
                <span className="mb-2 rounded-md bg-[#173938] px-2 py-1 text-[11px] font-bold text-[#99f0db]">
                  +4
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-5 text-[#c5d4d1]">Trending up, with two markers outside range.</p>
            </div>

            <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-[conic-gradient(#39deb8_0_85%,rgba(255,255,255,0.13)_85%_100%)]">
              <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[#102323]">
                <Icon name="trend" className="h-7 w-7 text-[#99f0db]" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex h-[96px] items-end gap-2 border-t border-white/10 pt-5">
            {scoreBars.map((height, index) => (
              <div key={index} className="flex flex-1 items-end">
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${height}px`,
                    backgroundColor: index === scoreBars.length - 1 ? "#39deb8" : "rgba(255,255,255,0.2)",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#a9bfba]">
            <span>Mar</span>
            <span>Jun</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-[#e2ebe8] bg-white p-3">
            <p className="text-[11px] font-bold text-[#7b8986]">Scanned</p>
            <p className="mt-2 text-[24px] font-black text-[#162523]">12</p>
          </div>
          <div className="rounded-lg border border-[#e2ebe8] bg-white p-3">
            <p className="text-[11px] font-bold text-[#7b8986]">Flagged</p>
            <p className="mt-2 text-[24px] font-black text-[#ba563d]">2</p>
          </div>
          <div className="rounded-lg border border-[#e2ebe8] bg-white p-3">
            <p className="text-[11px] font-bold text-[#7b8986]">Verified</p>
            <p className="mt-2 text-[24px] font-black text-[#087766]">96%</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[#dce9e5] bg-[#f7fbfa] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e8f7f2] text-[#087766]">
              <Icon name="calendar" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-black text-[#162523]">Doctor visit ready</h2>
                <span className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#52605d]">3 reports</span>
              </div>
              <p className="mt-1 text-[13px] leading-5 text-[#65716f]">
                CBC, HbA1c and Vitamin D are grouped for quick review.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-black text-[#101c1c]">Key parameters</h2>
          <button className="rounded-md bg-[#e8f7f2] px-3 py-2 text-[12px] font-bold text-[#087766]">Filter</button>
        </div>

        <div className="mt-3 space-y-3">
          {parameters.map((param) => (
            <article key={param.name} className="rounded-lg border border-[#e2ebe8] bg-white p-4 shadow-[0_10px_28px_rgba(20,67,60,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-black text-[#162523]">{param.name}</h3>
                  <p className="mt-1 text-[12px] font-medium text-[#7b8986]">{param.range}</p>
                </div>
                <div className="text-right">
                  <p className="text-[17px] font-black text-[#162523]">{param.value}</p>
                  <p className={`mt-1 rounded-md px-2 py-1 text-[11px] font-bold ${statusStyles(param.tone)}`}>
                    {param.status}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf3f1]">
                <div className={`h-full rounded-full ${barColor(param.tone)}`} style={{ width: param.width }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#8a9794]">
                <span>Trend: {param.trend}</span>
                <span>{param.width}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-lg border border-[#e2ebe8] bg-white p-4">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eaf9f2] text-[#087766]">
              <Icon name="shield" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[14px] font-black text-[#162523]">Smart summary</h2>
              <p className="mt-1 text-[13px] leading-5 text-[#65716f]">
                Sugar markers are above range. Vitamin D is low. Review the latest CBC and diabetes reports before
                your next doctor visit.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MobileShell>
  );
}

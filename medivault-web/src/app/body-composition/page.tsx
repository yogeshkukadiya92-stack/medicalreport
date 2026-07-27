"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BodyCompositionShell } from "@/components/body-composition-shell";
import { useAuth } from "@/components/auth-provider";
import { bodyReportTitle, reportMetric } from "@/lib/body-composition";
import { useBodyData } from "./_components/use-body-data";

export default function BodyCompositionDashboardPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data, error, isLoading, reload } = useBodyData();
  const metrics = data?.metrics;
  const recent = data?.reports.slice(0, 8) ?? [];
  const riskReports = data?.reports.filter((report) => report.values.some((value) => (value.name === "Visceral Fat Level" || value.name === "PBF") && value.status !== "Normal")).slice(0, 5) ?? [];

  async function openLogin() {
    await signOut();
    router.replace("/login?next=%2Fbody-composition");
  }

  return (
    <BodyCompositionShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0b806b]">Live body intelligence</p><h1 className="mt-1 text-[26px] font-black">Command dashboard</h1><p className="mt-1 text-[12px] font-semibold text-[#697875]">Scans, composition risk, verification and patient-app delivery from one workspace.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void reload()} className="h-10 rounded-md border border-[#bdd4ce] bg-white px-4 text-[11px] font-black text-[#075b4e]">Refresh</button><Link href="/body-composition/create?mode=upload" className="inline-flex h-10 items-center rounded-md border border-[#75b9a7] bg-white px-4 text-[11px] font-black text-[#075b4e]">Upload PDF / Photo</Link><Link href="/body-composition/create" className="inline-flex h-10 items-center rounded-md bg-[#075b4e] px-4 text-[11px] font-black text-white">+ Manual scan</Link></div>
      </header>
      {error ? (
        <div className="mt-4 flex flex-col gap-3 rounded-md border border-[#f3cfc5] bg-[#fff0ec] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black text-[#ba563d]">{error}</p>
            <p className="mt-1 text-[9px] font-semibold text-[#8b665d]">Use your admin or lab portal credentials to continue.</p>
          </div>
          <button type="button" onClick={openLogin} className="h-9 shrink-0 rounded-md bg-[#ba563d] px-4 text-[10px] font-black text-white">
            Sign in / switch account
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Clients", metrics?.clients ?? 0, "Matched by mobile"],
          ["Scans today", metrics?.scansToday ?? 0, "Live records"],
          ["Review inbox", metrics?.drafts ?? 0, "Awaiting verification"],
          ["Risk markers", metrics?.flagged ?? 0, "Scans needing attention"],
          ["Published", metrics?.published ?? 0, "Patient app ready"],
        ].map(([label, value, note]) => (
          <div key={String(label)} className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[9px] font-black uppercase text-[#74837f]">{label}</p><p className="mt-2 text-[27px] font-black">{isLoading ? "--" : value}</p><p className="mt-1 text-[10px] font-bold text-[#0b806b]">{note}</p></div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e7efed] p-4"><div><h2 className="text-[15px] font-black">Recent body scans</h2><p className="mt-1 text-[10px] font-semibold text-[#74837f]">Live draft and published composition records</p></div><Link href="/body-composition/reports" className="text-[10px] font-black text-[#0b806b]">View history</Link></div>
          <div className="hidden grid-cols-[1fr_100px_85px_85px_100px] gap-3 border-b border-[#e7efed] bg-[#f8fbfa] px-4 py-2 text-[9px] font-black uppercase text-[#74837f] md:grid"><span>Client / scan</span><span>Weight</span><span>Fat</span><span>Muscle</span><span>Status</span></div>
          <div className="divide-y divide-[#e7efed]">
            {recent.length ? recent.map((report) => {
              const weight = reportMetric(report, ["Weight"]);
              const fat = reportMetric(report, ["PBF", "Body Fat"]);
              const muscle = reportMetric(report, ["Skeletal Muscle Mass", "Muscle Mass"]);
              return <div key={report.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_100px_85px_85px_100px] md:items-center"><div className="min-w-0"><p className="truncate text-[11px] font-black">{report.clientName}</p><p className="mt-1 truncate text-[9px] font-semibold text-[#74837f]">{bodyReportTitle(report)} · {report.reportDate}</p></div><span className="text-[11px] font-black">{weight ? `${weight.value} ${weight.unit}` : "--"}</span><span className="text-[11px] font-black">{fat ? `${fat.value} ${fat.unit}` : "--"}</span><span className="text-[11px] font-black">{muscle ? `${muscle.value} ${muscle.unit}` : "--"}</span><span className={`w-fit rounded px-2 py-1 text-[9px] font-black ${report.status === "published" ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#fff7d8] text-[#8a6500]"}`}>{report.status}</span></div>;
            }) : <div className="p-8 text-center"><p className="text-[13px] font-black">No body scans yet</p><Link href="/body-composition/create" className="mt-2 inline-block text-[10px] font-black text-[#0b806b]">Add first scan</Link></div>}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-md bg-[#102f35] p-4 text-white"><p className="text-[9px] font-black uppercase text-[#74e7c8]">Patient app sync</p><p className="mt-2 text-[24px] font-black">{metrics?.published ?? 0} verified</p><p className="mt-1 text-[10px] font-semibold text-white/60">Published scans connect through the client mobile number.</p><Link href="/body-composition/imports" className="mt-4 inline-flex h-8 items-center rounded-md bg-[#55d6b3] px-3 text-[10px] font-black text-[#102f35]">Open review inbox</Link></section>
          <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white"><div className="border-b border-[#e7efed] p-4"><h2 className="text-[13px] font-black">Composition alerts</h2></div><div className="divide-y divide-[#e7efed]">{riskReports.length ? riskReports.map((report) => <div key={report.id} className="p-3"><p className="text-[11px] font-black">{report.clientName}</p><p className="mt-1 text-[9px] font-semibold text-[#ba563d]">{report.values.filter((value) => value.status !== "Normal").slice(0, 3).map((value) => `${value.name} ${value.status}`).join(" · ")}</p></div>) : <p className="p-4 text-[10px] font-semibold text-[#74837f]">No composition risk alerts.</p>}</div></section>
        </aside>
      </div>
    </BodyCompositionShell>
  );
}

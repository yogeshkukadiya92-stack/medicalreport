"use client";

import { useEffect, useMemo, useState } from "react";
import { BodyCompositionShell } from "@/components/body-composition-shell";
import { bodyReportTitle, reportMetric } from "@/lib/body-composition";
import { useBodyData } from "../_components/use-body-data";

export default function BodyCompositionReportsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const { data, error, isLoading, reload } = useBodyData();
  useEffect(() => {
    if (typeof window !== "undefined") setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, []);
  const reports = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (data?.reports ?? []).filter((report) => {
      if (status && report.status !== status) return false;
      return !search || `${report.clientName} ${report.clientPhone} ${report.labReportId}`.toLowerCase().includes(search);
    });
  }, [data?.reports, query, status]);

  return (
    <BodyCompositionShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0b806b]">Longitudinal records</p><h1 className="mt-1 text-[24px] font-black">Scan history</h1><p className="mt-1 text-[11px] font-semibold text-[#697875]">Search every draft and published body-composition report.</p></div><button type="button" onClick={() => void reload()} className="h-9 rounded-md border border-[#bdd4ce] bg-white px-4 text-[10px] font-black text-[#075b4e]">Refresh</button></header>
      <div className="mt-4 grid gap-2 rounded-md border border-[#dbe6e3] bg-white p-3 sm:grid-cols-[1fr_180px]"><input value={query} onChange={(event) => setQuery(event.target.value)} className="clinical-field" placeholder="Search client, mobile or scan ID" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="clinical-field"><option value="">Any status</option><option value="draft">Draft</option><option value="published">Published</option></select></div>
      {error ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-[11px] font-bold text-[#ba563d]">{error}</p> : null}
      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
        <div className="hidden grid-cols-[1fr_100px_90px_90px_100px_110px] gap-3 border-b border-[#e7efed] bg-[#f8fbfa] px-4 py-2 text-[9px] font-black uppercase text-[#74837f] md:grid"><span>Client / report</span><span>Date</span><span>Weight</span><span>Fat</span><span>Source</span><span>Status</span></div>
        <div className="divide-y divide-[#e7efed]">{reports.length ? reports.map((report) => {
          const weight = reportMetric(report, ["Weight"]);
          const fat = reportMetric(report, ["PBF", "Body Fat"]);
          return <div key={report.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_100px_90px_90px_100px_110px] md:items-center"><div className="min-w-0"><p className="truncate text-[11px] font-black">{report.clientName}</p><p className="mt-1 truncate text-[9px] font-semibold text-[#74837f]">{bodyReportTitle(report)} · {report.labReportId}</p></div><span className="text-[10px] font-bold">{report.reportDate}</span><span className="text-[10px] font-black">{weight ? `${weight.value} ${weight.unit}` : "--"}</span><span className="text-[10px] font-black">{fat ? `${fat.value} ${fat.unit}` : "--"}</span><span className="text-[9px] font-black uppercase text-[#52605d]">{report.entrySource || "lab"}</span><span className={`w-fit rounded px-2 py-1 text-[9px] font-black ${report.status === "published" ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#fff7d8] text-[#8a6500]"}`}>{report.status}</span></div>;
        }) : <div className="p-8 text-center text-[11px] font-bold text-[#74837f]">{isLoading ? "Loading scans..." : "No matching scan history."}</div>}</div>
      </section>
    </BodyCompositionShell>
  );
}

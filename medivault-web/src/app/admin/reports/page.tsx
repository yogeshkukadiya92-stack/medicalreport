"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import type { AdminReportRow, AdminReportsPayload } from "@/lib/admin-types";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, StatusPill } from "@/app/admin/_components/admin-ui";

type ReportFilters = { from: string; q: string; risk: string; status: string; sync: string; to: string };

function initialFilters(): ReportFilters {
  if (typeof window === "undefined") return { from: "", q: "", risk: "", status: "", sync: "", to: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    from: params.get("from") || "",
    q: params.get("q") || "",
    risk: params.get("risk") || "",
    status: params.get("status") || "",
    sync: params.get("sync") || "",
    to: params.get("to") || "",
  };
}

function initialReportId() {
  return typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("reportId") || "";
}

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function deliveryLabel(report: AdminReportRow) {
  if (report.deliveryState === "claimed") return "Visible in app";
  if (report.deliveryState === "unclaimed") return "Waiting phone link";
  return "Not linked";
}

export default function AdminReportsPage() {
  const { session, status } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [data, setData] = useState<AdminReportsPayload | null>(null);
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<AdminReportRow | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = useCallback(async (nextFilters: ReportFilters, nextPage = 1, requestedId = "") => {
    if (status === "loading") return;
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(nextPage), pageSize: "25" });
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    try {
      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Reports could not be loaded.");
      const nextData = result as AdminReportsPayload;
      setData(nextData);
      setPage(nextPage);
      if (requestedId) setSelectedReport(nextData.reports.find((report) => report.id === requestedId) ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Reports could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => { loadReports(filters, 1, initialReportId()); }, [loadReports]);
  useEffect(() => {
    if (!selectedReport) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedReport(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedReport]);

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();
    setSelectedReport(null);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    window.history.replaceState(null, "", params.toString() ? `/admin/reports?${params.toString()}` : "/admin/reports");
    loadReports(filters, 1);
  }

  function clearFilters() {
    const next = { from: "", q: "", risk: "", status: "", sync: "", to: "" };
    setFilters(next);
    setSelectedReport(null);
    window.history.replaceState(null, "", "/admin/reports");
    loadReports(next, 1);
  }

  function openReport(report: AdminReportRow) {
    setSelectedReport(report);
    const params = new URLSearchParams(window.location.search);
    params.set("reportId", report.id);
    window.history.replaceState(null, "", `/admin/reports?${params.toString()}`);
  }

  function closeReport() {
    setSelectedReport(null);
    const params = new URLSearchParams(window.location.search);
    params.delete("reportId");
    window.history.replaceState(null, "", params.toString() ? `/admin/reports?${params.toString()}` : "/admin/reports");
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 25)));

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Clinical control center"
        title="Reports"
        description="Review every report by risk, publication and patient delivery state, then open the record, Client 360 or customizable PDF workflow."
        actions={<Link href="/lab/create" className="inline-flex h-10 items-center rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white">Create report</Link>}
      />

      <form onSubmit={applyFilters} className="mt-5 grid gap-3 rounded-md border border-[#dbe6e3] bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_160px_160px_170px_150px_150px_auto_auto]">
        <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" placeholder="Client, mobile, report or accession" aria-label="Search reports" />
        <select value={filters.risk} onChange={(event) => setFilters((current) => ({ ...current, risk: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold" aria-label="Risk filter"><option value="">Any risk</option><option value="critical">High / Low values</option><option value="flagged">Any flagged</option><option value="normal">Normal only</option></select>
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold" aria-label="Report status"><option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option><option value="unclaimed">Unclaimed</option></select>
        <select value={filters.sync} onChange={(event) => setFilters((current) => ({ ...current, sync: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold" aria-label="Delivery state"><option value="">Any delivery</option><option value="claimed">Visible in patient app</option><option value="unclaimed">Waiting phone link</option></select>
        <input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] px-3 text-[11px] font-bold" aria-label="From date" />
        <input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] px-3 text-[11px] font-bold" aria-label="To date" />
        <button type="submit" disabled={isLoading} className="h-10 rounded-md bg-[#143d36] px-4 text-[11px] font-black text-white disabled:opacity-55">Apply</button>
        <button type="button" onClick={clearFilters} className="h-10 rounded-md border border-[#d5e2de] bg-white px-4 text-[11px] font-black text-[#526560]">Clear</button>
      </form>

      {error ? <AdminError message={error} onRetry={() => loadReports(filters, page)} /> : null}

      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
        <div className="flex items-center justify-between border-b border-[#e8efed] px-4 py-3"><div><h2 className="text-[13px] font-black">Report register</h2><p className="mt-0.5 text-[10px] font-semibold text-[#71817d]">{data ? `${data.total.toLocaleString("en-IN")} matching reports` : "Loading live reports"}</p></div><StatusPill tone="green">PHI PROTECTED</StatusPill></div>
        <div className="hidden grid-cols-[minmax(200px,1.3fr)_minmax(150px,1fr)_100px_90px_120px_100px] gap-3 border-b border-[#edf2f1] bg-[#f8fbfa] px-4 py-2.5 text-[9px] font-black uppercase text-[#71817d] md:grid"><span>Report</span><span>Client</span><span>Date</span><span>Risk</span><span>Delivery</span><span /></div>
        {isLoading && !data ? <AdminSkeleton rows={7} /> : data?.reports.length ? <div className="divide-y divide-[#edf2f1]">{data.reports.map((report) => (
          <button key={report.id} type="button" onClick={() => openReport(report)} className="grid w-full gap-3 px-4 py-3.5 text-left hover:bg-[#f8fbfa] md:grid-cols-[minmax(200px,1.3fr)_minmax(150px,1fr)_100px_90px_120px_100px] md:items-center">
            <span className="min-w-0"><span className="block truncate text-[12px] font-black text-[#16302b]">{report.title}</span><span className="mt-1 block truncate text-[10px] font-semibold text-[#71817d]">{report.labReportId} · {report.reportType} · {report.parameters} values</span></span>
            <span className="min-w-0"><span className="block truncate text-[11px] font-black">{report.clientName}</span><span className="mt-1 block text-[9px] font-semibold text-[#71817d]">{report.clientPhone}</span></span>
            <span className="text-[10px] font-bold text-[#53645f]">{formatDate(report.reportDate)}</span>
            <StatusPill tone={report.criticalValues || report.abnormal ? "critical" : "green"}>{report.criticalValues ? `${report.criticalValues} critical` : report.abnormal ? `${report.abnormal} flagged` : "Normal"}</StatusPill>
            <StatusPill tone={report.deliveryState === "claimed" ? "green" : "warning"}>{deliveryLabel(report)}</StatusPill>
            <span className="inline-flex h-8 items-center justify-center rounded-md bg-[#e6f6f1] px-3 text-[9px] font-black text-[#087766]">Review</span>
          </button>
        ))}</div> : <AdminEmpty title="No reports found" description="Change the filters or create a new lab report." action={<button type="button" onClick={clearFilters} className="text-[11px] font-black text-[#087766]">Reset filters</button>} />}
      </section>

      <div className="mt-4 flex items-center justify-between gap-3"><p className="text-[10px] font-bold text-[#71817d]">Page {page} of {totalPages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || isLoading} onClick={() => loadReports(filters, page - 1)} className="h-9 rounded-md border border-[#d5e2de] bg-white px-3 text-[10px] font-black disabled:opacity-45">Previous</button><button type="button" disabled={page >= totalPages || isLoading} onClick={() => loadReports(filters, page + 1)} className="h-9 rounded-md border border-[#d5e2de] bg-white px-3 text-[10px] font-black disabled:opacity-45">Next</button></div></div>

      {selectedReport ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#10231f]/38" onMouseDown={(event) => { if (event.currentTarget === event.target) closeReport(); }}>
          <aside className="h-full w-full max-w-[620px] overflow-y-auto bg-white shadow-[-20px_0_60px_rgba(7,38,32,0.18)]" role="dialog" aria-modal="true" aria-labelledby="report-drawer-title">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e4ecea] bg-white/96 p-5 backdrop-blur">
              <div className="min-w-0"><p className="text-[10px] font-black uppercase text-[#087766]">{selectedReport.reportType}</p><h2 id="report-drawer-title" className="mt-1 truncate text-[20px] font-black">{selectedReport.title}</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">{selectedReport.clientName} · {selectedReport.labReportId}</p></div>
              <button type="button" onClick={closeReport} className="h-9 shrink-0 rounded-md border border-[#d5e2de] px-3 text-[10px] font-black">Close</button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-md bg-[#f3f8f7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">Report date</p><p className="mt-1 text-[12px] font-black">{formatDate(selectedReport.reportDate)}</p></div>
              <div className="rounded-md bg-[#f3f8f7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">Delivery</p><p className="mt-1 text-[12px] font-black">{deliveryLabel(selectedReport)}</p></div>
              <div className="rounded-md bg-[#f3f8f7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">Doctor</p><p className="mt-1 text-[12px] font-black">{selectedReport.doctorName || "Not specified"}</p></div>
              <div className="rounded-md bg-[#f3f8f7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">Accession</p><p className="mt-1 text-[12px] font-black">{selectedReport.accessionNumber || "Not specified"}</p></div>
            </div>
            <div className="px-5"><p className="text-[10px] font-black uppercase text-[#71817d]">Clinical summary</p><p className="mt-2 rounded-md border border-[#dfe9e6] p-3 text-[11px] font-semibold leading-5 text-[#526560]">{selectedReport.summary}</p></div>
            <div className="mt-5 border-y border-[#e4ecea] bg-[#f8fbfa] px-5 py-3"><p className="text-[11px] font-black">Result values</p></div>
            <div className="divide-y divide-[#edf2f1] px-5">{selectedReport.values.map((value) => <div key={value.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_120px_100px]"><div className="min-w-0"><p className="truncate text-[11px] font-black">{value.name}</p><p className="mt-0.5 text-[9px] font-semibold text-[#71817d]">Range {value.referenceRange || "not set"}</p></div><p className="text-[11px] font-black">{value.value} {value.unit}</p><StatusPill tone={value.status === "Normal" ? "green" : value.status === "Watch" ? "warning" : "critical"}>{value.status}</StatusPill></div>)}</div>
            <div className="sticky bottom-0 grid gap-2 border-t border-[#dfe9e6] bg-white p-4 sm:grid-cols-3">
              <Link href={`/admin/clients/${encodeURIComponent(selectedReport.clientId)}`} className="inline-flex h-10 items-center justify-center rounded-md border border-[#d5e2de] text-[10px] font-black">Client 360</Link>
              <Link href={`/lab/reports?reportId=${encodeURIComponent(selectedReport.id)}`} className="inline-flex h-10 items-center justify-center rounded-md border border-[#bcdad2] bg-[#eaf8f4] text-[10px] font-black text-[#087766]">Full record</Link>
              <Link href={`/lab/pdf?reportId=${encodeURIComponent(selectedReport.id)}`} className="inline-flex h-10 items-center justify-center rounded-md bg-[#0b6f61] text-[10px] font-black text-white">PDF Studio</Link>
            </div>
          </aside>
        </div>
      ) : null}
    </AdminShell>
  );
}

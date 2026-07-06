"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import type { LabReport, ReportMarker } from "@/lib/vault-types";

const emptyFilters = { from: "", q: "", reportType: "", status: "", to: "" };

function markerClass(status: ReportMarker["status"]) {
  if (status === "High" || status === "Low") return "bg-[#fff0ec] text-[#ba563d]";
  if (status === "Watch") return "bg-[#fff7d8] text-[#8a6500]";
  return "bg-[#eaf9f2] text-[#087766]";
}

export default function LabReportsPage() {
  const { session } = useAuth();
  const [filters, setFilters] = useState(emptyFilters);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadReports() {
    if (!session?.access_token) return;
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const response = await fetch(`/api/lab/reports?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await response.json().catch(() => null);
    if (response.ok) {
      setReports(result?.reports ?? []);
    } else {
      setError(result?.error ?? "Reports could not be loaded.");
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, [session?.access_token]);

  const reportTypes = useMemo(() => [...new Set(reports.map((report) => report.reportType).filter(Boolean))], [reports]);

  async function openStoredFile(report: LabReport) {
    if (!report.fileId || !session?.access_token) return;
    const response = await fetch(`/api/files/${report.fileId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const fileUrl = URL.createObjectURL(blob);
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
  }

  return (
    <LabShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#087766]">Published lab records</p>
          <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Report history</h1>
        </div>
        <Link href="/lab/create" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
          Create report
        </Link>
      </div>

      <section className="mt-5 rounded-lg border border-[#e2ebe8] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_0.7fr_auto]">
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            className="h-10 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
            placeholder="Search phone, name, report ID"
          />
          <input
            value={filters.reportType}
            onChange={(event) => setFilters((current) => ({ ...current, reportType: event.target.value }))}
            list="report-types"
            className="h-10 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
            placeholder="Report type"
          />
          <datalist id="report-types">
            {reportTypes.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold">
            <option value="">Any status</option>
            <option value="published">Published</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="draft">Draft</option>
          </select>
          <input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="h-10 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" />
          <input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="h-10 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" />
          <button onClick={loadReports} className="h-10 rounded-lg bg-[#102323] px-4 text-[12px] font-bold text-white">
            Apply
          </button>
        </div>
      </section>

      {error ? <div className="mt-4 rounded-lg bg-[#fff0ec] p-3 text-[13px] font-bold text-[#ba563d]">{error}</div> : null}

      <section className="mt-5 rounded-lg border border-[#e2ebe8] bg-white">
        <div className="grid border-b border-[#edf3f1] p-4 text-[12px] font-black uppercase tracking-normal text-[#6f7f7c] md:grid-cols-[1.1fr_1fr_0.8fr_0.7fr_0.7fr]">
          <span>Report</span>
          <span>Client</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-[#edf3f1]">
          {reports.length ? (
            reports.map((report) => (
              <button key={report.id} onClick={() => setSelectedReport(report)} className="grid w-full gap-3 p-4 text-left hover:bg-[#f7fbfa] md:grid-cols-[1.1fr_1fr_0.8fr_0.7fr_0.7fr] md:items-center">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-black text-[#162523]">{report.title}</span>
                  <span className="mt-1 block truncate text-[12px] font-bold text-[#6f7f7c]">{report.labReportId}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-[#162523]">{report.clientName}</span>
                  <span className="mt-1 block text-[12px] font-bold text-[#6f7f7c]">{report.clientPhone}</span>
                </span>
                <span className="text-[12px] font-bold text-[#52605d]">{report.reportType}</span>
                <span className="text-[12px] font-bold text-[#52605d]">{report.reportDate}</span>
                <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-bold ${report.abnormal ? "bg-[#fff0ec] text-[#ba563d]" : "bg-[#eaf9f2] text-[#087766]"}`}>
                  {report.abnormal ? `${report.abnormal} flagged` : report.status}
                </span>
              </button>
            ))
          ) : (
            <div className="p-5 text-[13px] font-bold text-[#6f7f7c]">{isLoading ? "Loading reports..." : "No reports found."}</div>
          )}
        </div>
      </section>

      {selectedReport ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-4 md:place-items-center">
          <div className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-lg bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf3f1] p-5">
              <div>
                <p className="text-[12px] font-bold text-[#087766]">{selectedReport.clientName}</p>
                <h2 className="mt-1 text-[22px] font-black text-[#162523]">{selectedReport.title}</h2>
                <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{selectedReport.labReportId} - {selectedReport.reportDate}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                Close
              </button>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="rounded-lg bg-[#f7fbfa] p-4">
                <p className="text-[12px] font-bold text-[#087766]">Summary</p>
                <p className="mt-2 text-[13px] leading-5 text-[#52605d]">{selectedReport.summary}</p>
              </div>
              <div className="rounded-lg bg-[#f7fbfa] p-4 text-[13px] text-[#52605d]">
                <p><strong>Phone:</strong> {selectedReport.clientPhone}</p>
                <p className="mt-2"><strong>Doctor:</strong> {selectedReport.doctorName || "--"}</p>
                <p className="mt-2"><strong>Accession:</strong> {selectedReport.accessionNumber || "--"}</p>
                <p className="mt-2"><strong>File:</strong> {selectedReport.fileName || "Not attached"}</p>
              </div>
            </div>
            {selectedReport.fileId ? (
              <div className="px-5">
                <button onClick={() => openStoredFile(selectedReport)} className="h-11 w-full rounded-lg bg-[#0a7d6e] text-[13px] font-bold text-white">
                  Open original file
                </button>
              </div>
            ) : null}
            <div className="space-y-2 p-5">
              {selectedReport.values.map((value) => (
                <div key={value.id} className="grid gap-3 rounded-lg border border-[#e2ebe8] p-3 md:grid-cols-[1.2fr_0.8fr_1fr_120px] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-[#162523]">{value.name}</p>
                    {value.notes ? <p className="mt-1 text-[11px] text-[#7b8986]">{value.notes}</p> : null}
                  </div>
                  <p className="text-[13px] font-black text-[#162523]">{value.value} {value.unit}</p>
                  <p className="text-[12px] font-bold text-[#6f7f7c]">{value.referenceRange || "No range"}</p>
                  <p className={`w-fit rounded-md px-2 py-1 text-[11px] font-bold ${markerClass(value.status)}`}>{value.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </LabShell>
  );
}

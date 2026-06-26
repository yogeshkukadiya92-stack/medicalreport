"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AppReport } from "@/components/app-data-provider";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";

type Filter = "All" | "Starred" | "Needs review" | "Processing" | "Reviewed";

const filters: Filter[] = ["All", "Starred", "Needs review", "Processing", "Reviewed"];

function statusClass(report: AppReport) {
  if (report.status === "Processing") return "bg-[#eef5ff] text-[#4167a8]";
  if (report.abnormal > 0 || report.status === "Needs review") return "bg-[#fff0ec] text-[#ba563d]";
  return "bg-[#eaf9f2] text-[#087766]";
}

function markerClass(status: string) {
  if (status === "High" || status === "Low") return "bg-[#fff0ec] text-[#ba563d]";
  if (status === "Watch") return "bg-[#fff7d8] text-[#8a6500]";
  return "bg-[#eaf9f2] text-[#087766]";
}

export default function Reports() {
  const { activeMember, deleteReport, markReviewed, reportsForActiveMember, toggleStar, updateReport } = useAppData();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<AppReport | null>(null);
  const [editingReport, setEditingReport] = useState<AppReport | null>(null);
  const [editForm, setEditForm] = useState({ title: "", lab: "", category: "", summary: "" });
  const hasMember = Boolean(activeMember);

  const filteredReports = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reportsForActiveMember.filter((report) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Starred" && report.starred) ||
        (filter === "Needs review" && (report.abnormal > 0 || report.status === "Needs review")) ||
        report.status === filter;
      const searchable = `${report.title} ${report.lab} ${report.fileName} ${report.category} ${report.summary}`.toLowerCase();
      return matchesFilter && (!needle || searchable.includes(needle));
    });
  }, [filter, query, reportsForActiveMember]);

  function beginEdit(report: AppReport) {
    setEditingReport(report);
    setEditForm({
      title: report.title,
      lab: report.lab,
      category: report.category,
      summary: report.summary,
    });
  }

  function saveEdit() {
    if (!editingReport) return;
    updateReport(editingReport.id, {
      title: editForm.title.trim() || editingReport.title,
      lab: editForm.lab.trim() || editingReport.lab,
      category: editForm.category.trim() || editingReport.category,
      summary: editForm.summary.trim() || editingReport.summary,
    });
    setEditingReport(null);
  }

  return (
    <MobileShell>
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#6f7f7c]">{hasMember ? `${activeMember?.name}'s vault` : "Empty vault"}</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight text-[#101c1c]">Reports</h1>
          </div>
          <Link href="/upload" className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230]" aria-label="Upload">
            <Icon name="upload" className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-5 rounded-lg bg-[#102323] p-5 text-white shadow-[0_18px_44px_rgba(16,35,35,0.22)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[#a9bfba]">Total reports</p>
              <p className="mt-2 text-[42px] font-black leading-none">{reportsForActiveMember.length}</p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-white/10 text-[#99f0db]">
              <Icon name="shield" className="h-7 w-7" />
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-5 text-[#c5d4d1]">
            {hasMember ? "Search, review, edit, star, or remove reports from this vault." : "Add a family member first to begin storing reports."}
          </p>
        </div>

        <label className="mt-5 block">
          <span className="text-[12px] font-bold text-[#52605d]">Search reports</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, lab, file, category"
            className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-4 text-[13px] font-bold text-[#162523]"
          />
        </label>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`h-10 min-w-[96px] rounded-lg px-3 text-[12px] font-bold ${filter === item ? "bg-[#0a7d6e] text-white" : "border border-[#dce9e5] bg-white text-[#52605d]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        {!hasMember ? (
          <div className="mt-5 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5 text-center">
            <p className="text-[16px] font-black text-[#162523]">No reports yet</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Add a family member, then upload a report.</p>
            <Link href="/family" className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
              Add member
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredReports.length ? (
              filteredReports.map((report) => (
                <article key={report.id} className="rounded-lg border border-[#e2ebe8] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStar(report.id)}
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${report.starred ? "bg-[#fff7d8] text-[#a36a00]" : "bg-[#f1f6f4] text-[#087766]"}`}
                      aria-label={report.starred ? "Unstar report" : "Star report"}
                    >
                      {report.starred ? "*" : <Icon name="reports" className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-[15px] font-bold text-[#162523]">{report.title}</h2>
                          <p className="mt-1 truncate text-[12px] text-[#7b8986]">{report.lab}</p>
                          <span className="mt-2 inline-flex rounded-md bg-[#f1f6f4] px-2 py-1 text-[11px] font-bold text-[#52605d]">
                            {report.category}
                          </span>
                        </div>
                        <span className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ${statusClass(report)}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-[#65716f]">{report.summary}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#edf3f1] pt-3 text-[12px]">
                        <div>
                          <p className="text-[#8a9794]">Values</p>
                          <p className="mt-1 font-bold text-[#263432]">{report.parameters}</p>
                        </div>
                        <div>
                          <p className="text-[#8a9794]">Flagged</p>
                          <p className="mt-1 font-bold text-[#263432]">{report.abnormal}</p>
                        </div>
                        <div>
                          <p className="text-[#8a9794]">AI</p>
                          <p className="mt-1 font-bold text-[#263432]">{report.aiConfidence ? `${report.aiConfidence}%` : "--"}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button onClick={() => setSelectedReport(report)} aria-label={`View ${report.title}`} className="h-9 rounded-md bg-[#e8f7f2] text-[12px] font-bold text-[#087766]">
                          View
                        </button>
                        <button onClick={() => markReviewed(report.id)} className="h-9 rounded-md border border-[#dce9e5] text-[12px] font-bold text-[#52605d]">
                          Reviewed
                        </button>
                        <button onClick={() => beginEdit(report)} className="h-9 rounded-md border border-[#dce9e5] text-[12px] font-bold text-[#52605d]">
                          Edit
                        </button>
                      </div>
                      <button onClick={() => deleteReport(report.id)} className="mt-2 h-9 w-full rounded-md bg-[#fff0ec] text-[12px] font-bold text-[#ba563d]">
                        Delete report
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5 text-center">
                <p className="text-[14px] font-black text-[#162523]">No reports found</p>
                <p className="mt-2 text-[13px] text-[#65716f]">Upload a report or switch filters.</p>
                <Link href="/upload" className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
                  Upload report
                </Link>
              </div>
            )}
          </div>
        )}

        {selectedReport ? (
          <div className="fixed inset-0 z-40 grid place-items-end bg-black/30 px-4 pb-4">
            <div className="max-h-[86vh] w-full max-w-[430px] overflow-y-auto rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold text-[#087766]">Report details</p>
                  <h2 className="mt-1 text-[20px] font-black text-[#162523]">{selectedReport.title}</h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-2 text-[13px] text-[#52605d]">
                <p><strong>Member:</strong> {selectedReport.memberName}</p>
                <p><strong>Lab:</strong> {selectedReport.lab}</p>
                <p><strong>File:</strong> {selectedReport.fileName}</p>
                <p><strong>Category:</strong> {selectedReport.category}</p>
                <p><strong>Status:</strong> {selectedReport.status}</p>
                <p><strong>AI confidence:</strong> {selectedReport.aiConfidence ? `${selectedReport.aiConfidence}%` : "Processing"}</p>
              </div>
              <div className="mt-4 rounded-lg bg-[#f7fbfa] p-4">
                <p className="text-[12px] font-bold text-[#087766]">AI summary</p>
                <p className="mt-2 text-[13px] leading-5 text-[#52605d]">{selectedReport.summary}</p>
              </div>
              {selectedReport.markers.length ? (
                <div className="mt-4 space-y-2">
                  {selectedReport.markers.map((marker) => (
                    <div key={marker.name} className="flex items-center justify-between gap-3 rounded-lg border border-[#e2ebe8] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black text-[#162523]">{marker.name}</p>
                        <p className="mt-1 text-[11px] text-[#7b8986]">{marker.range}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-black text-[#162523]">{marker.value}</p>
                        <p className={`mt-1 rounded-md px-2 py-1 text-[11px] font-bold ${markerClass(marker.status)}`}>{marker.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {editingReport ? (
          <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 px-4 pb-4">
            <div className="w-full max-w-[430px] rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold text-[#087766]">Edit report</p>
                  <h2 className="mt-1 text-[20px] font-black text-[#162523]">{editingReport.title}</h2>
                </div>
                <button onClick={() => setEditingReport(null)} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                  Close
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className="h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="Report title" />
                <input value={editForm.lab} onChange={(event) => setEditForm((current) => ({ ...current, lab: event.target.value }))} className="h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="Lab or doctor" />
                <input value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))} className="h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="Category" />
                <textarea value={editForm.summary} onChange={(event) => setEditForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-[96px] w-full rounded-lg border border-[#dce9e5] p-3 text-[13px] font-medium" placeholder="Summary" />
                <button onClick={saveEdit} className="h-11 w-full rounded-lg bg-[#0a7d6e] text-[13px] font-bold text-white">
                  Save changes
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </MobileShell>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AppReport, ReportMarker } from "@/components/app-data-provider";
import { useAppData } from "@/components/app-data-provider";
import { useAuth } from "@/components/auth-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";

type Filter = "All" | "Starred" | "Needs review" | "Processing" | "Reviewed";

const filters: Filter[] = ["All", "Starred", "Needs review", "Processing", "Reviewed"];
const biomarkerSuggestions = [
  "Vitamin D",
  "Vitamin B12",
  "HbA1c",
  "Fasting Blood Sugar",
  "Postprandial Blood Sugar",
  "Random Blood Sugar",
  "Hemoglobin",
  "WBC",
  "RBC",
  "Platelets",
  "TSH",
  "T3",
  "T4",
  "Total Cholesterol",
  "LDL Cholesterol",
  "HDL Cholesterol",
  "Triglycerides",
  "Creatinine",
  "Uric Acid",
  "SGPT",
  "SGOT",
  "Bilirubin",
  "Calcium",
  "Ferritin",
];

type ManualMarkerDraft = ReportMarker & { id: string };

const emptyMarker = (): ManualMarkerDraft => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name: "",
  range: "",
  status: "Normal",
  value: "",
});

function statusClass(report: AppReport) {
  if (report.status === "Processing") return "bg-[#eef5ff] text-[#4167a8]";
  if (report.abnormal > 0 || report.status === "Needs review") return "bg-[#fff0ec] text-[#ba563d]";
  return "bg-[#eaf9f2] text-[#087766]";
}

function sourceClass(report: AppReport) {
  return report.source === "lab" ? "bg-[#eef5ff] text-[#4167a8]" : "bg-[#f1f6f4] text-[#52605d]";
}

function markerClass(status: string) {
  if (status === "High" || status === "Low") return "bg-[#fff0ec] text-[#ba563d]";
  if (status === "Watch") return "bg-[#fff7d8] text-[#8a6500]";
  return "bg-[#eaf9f2] text-[#087766]";
}

export default function Reports() {
  const { session } = useAuth();
  const { activeMember, addManualReport, deleteReport, markReviewed, reportsForActiveMember, toggleStar, updateReport } = useAppData();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<AppReport | null>(null);
  const [editingReport, setEditingReport] = useState<AppReport | null>(null);
  const [editForm, setEditForm] = useState({ title: "", lab: "", category: "", summary: "" });
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    category: "Manual",
    lab: "Manual entry",
    title: "Manual health values",
  });
  const [manualMarkers, setManualMarkers] = useState<ManualMarkerDraft[]>([emptyMarker()]);
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
    if (report.source === "lab") return;
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

  function updateManualMarker(id: string, patch: Partial<ManualMarkerDraft>) {
    setManualMarkers((current) => current.map((marker) => (marker.id === id ? { ...marker, ...patch } : marker)));
  }

  function saveManualReport() {
    if (!activeMember) return;
    const markers = manualMarkers
      .filter((marker) => marker.name.trim() && marker.value.trim())
      .map(({ id: _id, ...marker }) => ({
        ...marker,
        name: marker.name.trim(),
        range: marker.range.trim() || "Reference range not added",
        value: marker.value.trim(),
      }));
    if (!markers.length) return;
    addManualReport({
      category: manualForm.category,
      lab: manualForm.lab,
      markers,
      memberId: activeMember.id,
      title: manualForm.title,
    });
    setManualForm({ category: "Manual", lab: "Manual entry", title: "Manual health values" });
    setManualMarkers([emptyMarker()]);
    setIsManualOpen(false);
  }

  async function openStoredFile(report: AppReport) {
    if (!report.fileId || !session?.access_token) return;

    const response = await fetch(`/api/files/${report.fileId}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) return;

    const blob = await response.blob();
    const fileUrl = URL.createObjectURL(blob);
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000);
  }

  async function removeReport(report: AppReport) {
    if (report.source === "lab") return;
    if (report.fileId && session?.access_token) {
      fetch(`/api/files/${report.fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }).catch(() => {
        // Metadata delete should still work if file cleanup is temporarily unavailable.
      });
    }
    deleteReport(report.id);
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

        {hasMember ? (
          <button
            onClick={() => setIsManualOpen(true)}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0a7d6e] text-[14px] font-bold text-white shadow-[0_12px_30px_rgba(10,125,110,0.18)]"
          >
            <span className="text-[18px] leading-none">+</span>
            Add values manually
          </button>
        ) : null}

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
                      onClick={() => (report.source === "lab" ? undefined : toggleStar(report.id))}
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${report.starred ? "bg-[#fff7d8] text-[#a36a00]" : "bg-[#f1f6f4] text-[#087766]"}`}
                      aria-label={report.source === "lab" ? "Lab report" : report.starred ? "Unstar report" : "Star report"}
                    >
                      {report.source === "lab" ? <Icon name="shield" className="h-5 w-5" /> : report.starred ? "*" : <Icon name="reports" className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-[15px] font-bold text-[#162523]">{report.title}</h2>
                          <p className="mt-1 truncate text-[12px] text-[#7b8986]">{report.lab}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="inline-flex rounded-md bg-[#f1f6f4] px-2 py-1 text-[11px] font-bold text-[#52605d]">
                              {report.category}
                            </span>
                            <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold ${sourceClass(report)}`}>
                              {report.source === "lab" ? "Lab Report" : "Uploaded by you"}
                            </span>
                          </div>
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
                          <p className="text-[#8a9794]">{report.source === "lab" ? "Source" : "AI"}</p>
                          <p className="mt-1 font-bold text-[#263432]">{report.source === "lab" ? "Lab" : report.aiConfidence ? `${report.aiConfidence}%` : "--"}</p>
                        </div>
                      </div>
                      <div className={`mt-4 grid gap-2 ${report.source === "lab" ? "grid-cols-1" : "grid-cols-3"}`}>
                        <button onClick={() => setSelectedReport(report)} aria-label={`View ${report.title}`} className="h-9 rounded-md bg-[#e8f7f2] text-[12px] font-bold text-[#087766]">
                          View
                        </button>
                        {report.source !== "lab" ? (
                          <>
                            <button onClick={() => markReviewed(report.id)} className="h-9 rounded-md border border-[#dce9e5] text-[12px] font-bold text-[#52605d]">
                              Reviewed
                            </button>
                            <button onClick={() => beginEdit(report)} className="h-9 rounded-md border border-[#dce9e5] text-[12px] font-bold text-[#52605d]">
                              Edit
                            </button>
                          </>
                        ) : null}
                      </div>
                      {report.source !== "lab" ? (
                        <button onClick={() => removeReport(report)} className="mt-2 h-9 w-full rounded-md bg-[#fff0ec] text-[12px] font-bold text-[#ba563d]">
                          Delete report
                        </button>
                      ) : null}
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
                <p><strong>Source:</strong> {selectedReport.source === "lab" ? "Published by lab" : "Uploaded by you"}</p>
                <p><strong>Lab:</strong> {selectedReport.lab}</p>
                {selectedReport.labReportId ? <p><strong>Lab report ID:</strong> {selectedReport.labReportId}</p> : null}
                {selectedReport.doctorName ? <p><strong>Doctor:</strong> {selectedReport.doctorName}</p> : null}
                {selectedReport.accessionNumber ? <p><strong>Accession:</strong> {selectedReport.accessionNumber}</p> : null}
                {selectedReport.sampleCollectedAt ? <p><strong>Sample collected:</strong> {selectedReport.sampleCollectedAt}</p> : null}
                <p><strong>File:</strong> {selectedReport.fileName}</p>
                <p><strong>Stored:</strong> {selectedReport.fileId ? "Original file saved" : "Original file not available"}</p>
                <p><strong>Category:</strong> {selectedReport.category}</p>
                <p><strong>Status:</strong> {selectedReport.status}</p>
                {selectedReport.source !== "lab" ? (
                  <p><strong>AI confidence:</strong> {selectedReport.aiConfidence ? `${selectedReport.aiConfidence}%` : "Processing"}</p>
                ) : null}
              </div>
              {selectedReport.fileId ? (
                <button
                  onClick={() => openStoredFile(selectedReport)}
                  className="mt-4 h-11 w-full rounded-lg bg-[#0a7d6e] text-[13px] font-bold text-white"
                >
                  View original file
                </button>
              ) : null}
              <div className="mt-4 rounded-lg bg-[#f7fbfa] p-4">
                <p className="text-[12px] font-bold text-[#087766]">{selectedReport.source === "lab" ? "Rule summary" : "AI summary"}</p>
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

        {isManualOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 px-4 pb-4">
            <div className="max-h-[88vh] w-full max-w-[430px] overflow-y-auto rounded-lg bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-bold text-[#087766]">Manual entry</p>
                  <h2 className="mt-1 text-[20px] font-black text-[#162523]">Add health values</h2>
                </div>
                <button onClick={() => setIsManualOpen(false)} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[12px] font-bold">
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <input
                  value={manualForm.title}
                  onChange={(event) => setManualForm((current) => ({ ...current, title: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                  placeholder="Report title"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={manualForm.category}
                    onChange={(event) => setManualForm((current) => ({ ...current, category: event.target.value }))}
                    className="h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                    placeholder="Category"
                  />
                  <input
                    value={manualForm.lab}
                    onChange={(event) => setManualForm((current) => ({ ...current, lab: event.target.value }))}
                    className="h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                    placeholder="Lab or source"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {manualMarkers.map((marker, index) => {
                  const markerSuggestions = biomarkerSuggestions
                    .filter((name) => name.toLowerCase().includes(marker.name.toLowerCase().trim()))
                    .slice(0, 5);
                  return (
                    <div key={marker.id} className="rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-black text-[#162523]">Value {index + 1}</p>
                        {manualMarkers.length > 1 ? (
                          <button onClick={() => setManualMarkers((current) => current.filter((item) => item.id !== marker.id))} className="text-[12px] font-bold text-[#ba563d]">
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <label className="mt-3 block">
                        <span className="text-[11px] font-bold text-[#52605d]">Test name</span>
                        <input
                          list={`biomarkers-${marker.id}`}
                          value={marker.name}
                          onChange={(event) => updateManualMarker(marker.id, { name: event.target.value })}
                          className="mt-1 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold"
                          placeholder="Type vitamin, sugar, cholesterol..."
                        />
                        <datalist id={`biomarkers-${marker.id}`}>
                          {markerSuggestions.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
                        {marker.name ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {markerSuggestions.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => updateManualMarker(marker.id, { name })}
                                className="rounded-md bg-[#e8f7f2] px-2.5 py-1 text-[11px] font-bold text-[#087766]"
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </label>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <input
                          value={marker.value}
                          onChange={(event) => updateManualMarker(marker.id, { value: event.target.value })}
                          className="h-11 rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold"
                          placeholder="Value e.g. 18 ng/mL"
                        />
                        <select
                          value={marker.status}
                          onChange={(event) => updateManualMarker(marker.id, { status: event.target.value as ReportMarker["status"] })}
                          className="h-11 rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold"
                        >
                          <option>Normal</option>
                          <option>High</option>
                          <option>Low</option>
                          <option>Watch</option>
                        </select>
                      </div>
                      <input
                        value={marker.range}
                        onChange={(event) => updateManualMarker(marker.id, { range: event.target.value })}
                        className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold"
                        placeholder="Reference range e.g. 30-100 ng/mL"
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setManualMarkers((current) => [...current, emptyMarker()])}
                className="mt-3 h-11 w-full rounded-lg border border-[#dce9e5] bg-white text-[13px] font-bold text-[#087766]"
              >
                Add another value
              </button>
              <button onClick={saveManualReport} className="mt-3 h-11 w-full rounded-lg bg-[#0a7d6e] text-[13px] font-bold text-white">
                Save manual report
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </MobileShell>
  );
}

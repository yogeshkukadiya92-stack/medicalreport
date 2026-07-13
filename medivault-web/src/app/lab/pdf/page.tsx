"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LabShell } from "@/components/lab-shell";
import { formatDateLabel } from "@/lib/date-client";
import type { LabReport } from "@/lib/vault-types";

type Accent = "blue" | "burgundy" | "charcoal" | "teal";
type CustomField = { id: string; label: string; value: string };
type Sections = {
  accession: boolean;
  doctor: boolean;
  labAddress: boolean;
  patientPhone: boolean;
  referenceRanges: boolean;
  resultNotes: boolean;
  sampleCollectedAt: boolean;
  statuses: boolean;
  summary: boolean;
};

const defaultSections: Sections = {
  accession: true,
  doctor: true,
  labAddress: true,
  patientPhone: true,
  referenceRanges: true,
  resultNotes: true,
  sampleCollectedAt: true,
  statuses: true,
  summary: true,
};

const accentOptions: Array<{ color: string; id: Accent; label: string }> = [
  { color: "#087766", id: "teal", label: "Clinical teal" },
  { color: "#14528c", id: "blue", label: "Trust blue" },
  { color: "#7a1f33", id: "burgundy", label: "Burgundy" },
  { color: "#222b31", id: "charcoal", label: "Charcoal" },
];

const sectionOptions: Array<{ id: keyof Sections; label: string }> = [
  { id: "patientPhone", label: "Patient phone" },
  { id: "doctor", label: "Doctor" },
  { id: "accession", label: "Accession" },
  { id: "sampleCollectedAt", label: "Sample time" },
  { id: "labAddress", label: "Lab address" },
  { id: "referenceRanges", label: "Reference ranges" },
  { id: "statuses", label: "Result status" },
  { id: "resultNotes", label: "Result notes" },
  { id: "summary", label: "Smart summary" },
];

function createField(): CustomField {
  return { id: `field-${Date.now()}-${Math.random().toString(16).slice(2)}`, label: "", value: "" };
}

function reportFileName(report: LabReport) {
  const base = `${report.clientName}-${report.reportType}-${report.reportDate}`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "lab-report"}.pdf`;
}

function bundleFileName(reports: LabReport[]) {
  const first = reports[0];
  const base = `${first?.clientName || "client"}-${first?.reportDate || "reports"}-bundle`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "lab-report-bundle"}.pdf`;
}

export default function LabPdfStudioPage() {
  const { isConfigured, session, status } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [bundleMode, setBundleMode] = useState(false);
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [accent, setAccent] = useState<Accent>("teal");
  const [sections, setSections] = useState<Sections>(defaultSections);
  const [customTitle, setCustomTitle] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [footerText, setFooterText] = useState("This report should be interpreted by a qualified healthcare professional.");
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryRole, setSignatoryRole] = useState("Pathologist");
  const [customFields, setCustomFields] = useState<CustomField[]>([createField()]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [generatedReportId, setGeneratedReportId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedReport = useMemo(() => reports.find((report) => report.id === selectedId) ?? null, [reports, selectedId]);
  const selectedBundleReports = useMemo(
    () => selectedBundleIds.flatMap((id) => reports.find((report) => report.id === id) ?? []),
    [reports, selectedBundleIds],
  );
  const activeDocumentKey = bundleMode ? `bundle:${selectedBundleIds.join(",")}` : selectedId;
  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return reports;
    return reports.filter((report) => [report.clientName, report.clientPhone, report.reportType, report.title, report.labReportId]
      .join(" ")
      .toLowerCase()
      .includes(normalized));
  }, [query, reports]);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }
    if (status === "loading") return;
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }
    let active = true;
    async function loadReports() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch("/api/lab/operations?view=document-center", { headers: { Authorization: `Bearer ${session?.access_token}` } });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error ?? "Reports could not be loaded.");
        if (!active) return;
        const nextReports: LabReport[] = result?.reports ?? [];
        const linkedId = new URLSearchParams(window.location.search).get("reportId") ?? "";
        setReports(nextReports);
        const nextSelectedId = nextReports.some((report) => report.id === linkedId) ? linkedId : nextReports[0]?.id ?? "";
        setSelectedId(nextSelectedId);
        setSelectedBundleIds(nextSelectedId ? [nextSelectedId] : []);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Reports could not be loaded.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadReports();
    return () => { active = false; };
  }, [isConfigured, session?.access_token, status]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function resetGeneratedPdf() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPdfBlob(null);
    setGeneratedReportId("");
    setMessage("");
  }

  function selectReport(reportId: string) {
    setSelectedId(reportId);
    setSelectedBundleIds((current) => current.includes(reportId) ? current : [reportId]);
    resetGeneratedPdf();
    const params = new URLSearchParams(window.location.search);
    params.set("reportId", reportId);
    window.history.replaceState(null, "", `/lab/pdf?${params.toString()}`);
  }

  function toggleBundleReport(report: LabReport) {
    setSelectedId(report.id);
    setSelectedBundleIds((current) => {
      const next = current.includes(report.id) ? current.filter((id) => id !== report.id) : [...current, report.id];
      return next.length ? next : [report.id];
    });
    resetGeneratedPdf();
  }

  function selectSameClientDate(report = selectedReport) {
    if (!report) return;
    const matchingIds = reports
      .filter((item) => item.clientPhone === report.clientPhone && item.reportDate === report.reportDate)
      .map((item) => item.id);
    setBundleMode(true);
    setSelectedBundleIds(matchingIds.length ? matchingIds : [report.id]);
    setSelectedId(report.id);
    resetGeneratedPdf();
  }

  function updateField(id: string, key: "label" | "value", value: string) {
    setCustomFields((current) => current.map((field) => field.id === id ? { ...field, [key]: value } : field));
    resetGeneratedPdf();
  }

  function removeField(id: string) {
    setCustomFields((current) => current.length > 1 ? current.filter((field) => field.id !== id) : [createField()]);
    resetGeneratedPdf();
  }

  async function generatePdf() {
    const reportsForBundle = bundleMode ? selectedBundleReports : [];
    if ((!bundleMode && !selectedReport) || (bundleMode && !reportsForBundle.length) || !session?.access_token) return null;
    setIsGenerating(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/lab/operations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: bundleMode ? "generate_document_bundle" : "generate_document",
          accent,
          clinicalNotes,
          customFields: customFields.map(({ label, value }) => ({ label, value })),
          customTitle,
          footerText,
          reportId: selectedReport?.id,
          reportIds: reportsForBundle.map((report) => report.id),
          sections,
          signatoryName,
          signatoryRole,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "PDF could not be generated.");
      }
      const blob = await response.blob();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const nextUrl = URL.createObjectURL(blob);
      setPreviewUrl(nextUrl);
      setPdfBlob(blob);
      setGeneratedReportId(activeDocumentKey);
      setMessage(bundleMode ? `${reportsForBundle.length} reports bundled. Preview, download or share it now.` : "PDF generated. Preview, download or share it now.");
      return blob;
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "PDF could not be generated.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  async function currentPdf() {
    if (pdfBlob && generatedReportId === activeDocumentKey) return pdfBlob;
    return generatePdf();
  }

  async function downloadPdf() {
    if (!selectedReport && !selectedBundleReports.length) return;
    const blob = await currentPdf();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = bundleMode ? bundleFileName(selectedBundleReports) : reportFileName(selectedReport as LabReport);
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("PDF download started.");
  }

  async function sharePdf() {
    if (!selectedReport && !selectedBundleReports.length) return;
    const blob = await currentPdf();
    if (!blob) return;
    const fileName = bundleMode ? bundleFileName(selectedBundleReports) : reportFileName(selectedReport as LabReport);
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({
          files: [file],
          title: bundleMode ? "Lab report bundle" : selectedReport?.title,
          text: bundleMode ? `${selectedBundleReports.length} lab reports for ${selectedBundleReports[0]?.clientName}` : `${selectedReport?.reportType} report for ${selectedReport?.clientName}`,
        });
        setMessage("PDF shared successfully.");
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
        setError("This browser could not share the PDF. Use Download instead.");
      }
      return;
    }
    await downloadPdf();
    setMessage("Direct file sharing is unavailable here, so the PDF was downloaded.");
  }

  return (
    <LabShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-black uppercase text-[#087766]">Report delivery</p>
          <h1 className="mt-1 text-[27px] font-black text-[#101c1c]">PDF Studio</h1>
          <p className="mt-1 text-[12px] font-semibold text-[#6f7f7c]">Compose one report or bundle multiple same-day reports into a single patient-ready PDF.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={(!bundleMode && !selectedReport) || (bundleMode && !selectedBundleReports.length) || isGenerating} onClick={generatePdf} className="h-10 rounded-md bg-[#102323] px-4 text-[11px] font-black text-white disabled:opacity-50">
            {isGenerating ? "Generating..." : "Generate preview"}
          </button>
          <button type="button" disabled={(!bundleMode && !selectedReport) || (bundleMode && !selectedBundleReports.length) || isGenerating} onClick={sharePdf} className="h-10 rounded-md bg-[#0a7d6e] px-4 text-[11px] font-black text-white disabled:opacity-50">Share PDF</button>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-md bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</p> : null}
      {message ? <p className="mt-4 rounded-md bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</p> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-md border border-[#dce9e5] bg-white">
          <div className="border-b border-[#e7efed] p-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] font-black uppercase text-[#74837f]" htmlFor="pdf-report-search">{bundleMode ? "Select reports" : "Select report"}</label>
              <button type="button" onClick={() => { setBundleMode((current) => !current); resetGeneratedPdf(); }} className={`h-7 rounded-md px-2 text-[9px] font-black ${bundleMode ? "bg-[#102323] text-white" : "border border-[#c9dad5] text-[#31534d]"}`}>
                {bundleMode ? "Bundle on" : "Bundle mode"}
              </button>
            </div>
            <input id="pdf-report-search" value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 h-9 w-full rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold" placeholder="Patient, phone or report ID" />
            {bundleMode ? (
              <div className="mt-2 rounded-md bg-[#f4fbf8] p-2">
                <p className="text-[10px] font-bold text-[#31534d]">{selectedBundleReports.length} selected</p>
                <button type="button" onClick={() => selectSameClientDate()} disabled={!selectedReport} className="mt-2 h-8 w-full rounded-md border border-[#b8d4cc] bg-white text-[10px] font-black text-[#087766] disabled:opacity-40">
                  Select same client + date
                </button>
              </div>
            ) : null}
          </div>
          <div className="max-h-[660px] divide-y divide-[#edf3f1] overflow-y-auto">
            {filteredReports.length ? filteredReports.map((report) => (
              <button key={report.id} type="button" onClick={() => bundleMode ? toggleBundleReport(report) : selectReport(report.id)} className={`flex w-full gap-2 p-3 text-left ${selectedId === report.id || selectedBundleIds.includes(report.id) ? "bg-[#eaf9f2]" : "hover:bg-[#f8fbfa]"}`}>
                {bundleMode ? <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] font-black ${selectedBundleIds.includes(report.id) ? "border-[#0a7d6e] bg-[#0a7d6e] text-white" : "border-[#cbd8d5] bg-white text-transparent"}`}>✓</span> : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-black text-[#17222b]">{report.clientName}</span>
                  <span className="mt-1 block truncate text-[10px] font-bold text-[#52605d]">{report.reportType} · {formatDateLabel(report.reportDate)}</span>
                  <span className="mt-1 block truncate text-[9px] font-semibold text-[#879590]">{report.labReportId} · {report.parameters} results</span>
                </span>
              </button>
            )) : <p className="p-4 text-[11px] font-bold text-[#74837f]">{isLoading ? "Loading reports..." : "No matching reports."}</p>}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="rounded-md border border-[#dce9e5] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-[#087766]">Document setup</p>
                <h2 className="mt-1 text-[16px] font-black text-[#17222b]">{bundleMode ? `${selectedBundleReports.length} report bundle` : selectedReport?.title ?? "Choose a report"}</h2>
                {bundleMode && selectedBundleReports.length ? <p className="mt-1 text-[10px] font-semibold text-[#74837f]">{selectedBundleReports[0].clientName} · {formatDateLabel(selectedBundleReports[0].reportDate)} · {selectedBundleReports.map((report) => report.reportType).join(", ")}</p> : null}
                {!bundleMode && selectedReport ? <p className="mt-1 text-[10px] font-semibold text-[#74837f]">{selectedReport.clientName} · {selectedReport.labReportId}</p> : null}
              </div>
              <button type="button" disabled={!pdfBlob} onClick={downloadPdf} className="h-9 rounded-md border border-[#bfcfcb] px-3 text-[10px] font-black text-[#31534d] disabled:opacity-40">Download</button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-black uppercase text-[#74837f]">PDF title</span>
                <input value={customTitle} onChange={(event) => { setCustomTitle(event.target.value); resetGeneratedPdf(); }} className="mt-2 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold" placeholder={selectedReport?.title || "Custom report title"} />
              </label>
              <div>
                <span className="text-[10px] font-black uppercase text-[#74837f]">Accent color</span>
                <div className="mt-2 flex h-10 items-center gap-2">
                  {accentOptions.map((option) => (
                    <button key={option.id} type="button" title={option.label} aria-label={option.label} aria-pressed={accent === option.id} onClick={() => { setAccent(option.id); resetGeneratedPdf(); }} className={`h-8 w-8 rounded-md border-2 ${accent === option.id ? "border-[#17222b]" : "border-white shadow-[0_0_0_1px_#cbd8d5]"}`} style={{ backgroundColor: option.color }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-[#edf3f1] pt-4">
              <p className="text-[10px] font-black uppercase text-[#74837f]">Included sections</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sectionOptions.map((option) => (
                  <label key={option.id} className="flex h-9 items-center gap-2 rounded-md border border-[#e2ebe8] px-3 text-[10px] font-bold text-[#31534d]">
                    <input type="checkbox" checked={sections[option.id]} onChange={(event) => { setSections((current) => ({ ...current, [option.id]: event.target.checked })); resetGeneratedPdf(); }} className="h-4 w-4 accent-[#0a7d6e]" />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#dce9e5] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-[14px] font-black text-[#17222b]">Additional details</h2><p className="mt-1 text-[10px] font-semibold text-[#74837f]">Add up to 12 label-value rows to this PDF.</p></div>
              <button type="button" disabled={customFields.length >= 12} onClick={() => setCustomFields((current) => [...current, createField()])} className="h-8 rounded-md border border-[#bfcfcb] px-3 text-[10px] font-black text-[#087766] disabled:opacity-40">+ Add detail</button>
            </div>
            <div className="mt-3 space-y-2">
              {customFields.map((field) => (
                <div key={field.id} className="grid gap-2 sm:grid-cols-[0.7fr_1.3fr_34px]">
                  <input value={field.label} onChange={(event) => updateField(field.id, "label", event.target.value)} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[10px] font-bold" placeholder="Label, e.g. Fasting" />
                  <input value={field.value} onChange={(event) => updateField(field.id, "value", event.target.value)} className="h-9 rounded-md border border-[#dce9e5] px-3 text-[10px] font-bold" placeholder="Value" />
                  <button type="button" onClick={() => removeField(field.id)} aria-label="Remove detail" title="Remove detail" className="h-9 rounded-md border border-[#f0d5ce] text-[16px] font-bold text-[#ba563d]">×</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-[#dce9e5] bg-white p-4">
            <h2 className="text-[14px] font-black text-[#17222b]">Notes and authorization</h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label className="block lg:col-span-2"><span className="text-[10px] font-black uppercase text-[#74837f]">Clinical notes</span><textarea value={clinicalNotes} onChange={(event) => { setClinicalNotes(event.target.value); resetGeneratedPdf(); }} className="mt-2 min-h-[80px] w-full rounded-md border border-[#dce9e5] p-3 text-[11px] font-semibold" placeholder="Interpretation, recommendation or collection note" /></label>
              <label className="block"><span className="text-[10px] font-black uppercase text-[#74837f]">Signatory name</span><input value={signatoryName} onChange={(event) => { setSignatoryName(event.target.value); resetGeneratedPdf(); }} className="mt-2 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold" placeholder="Dr. Name" /></label>
              <label className="block"><span className="text-[10px] font-black uppercase text-[#74837f]">Role / qualification</span><input value={signatoryRole} onChange={(event) => { setSignatoryRole(event.target.value); resetGeneratedPdf(); }} className="mt-2 h-10 w-full rounded-md border border-[#dce9e5] px-3 text-[11px] font-bold" /></label>
              <label className="block lg:col-span-2"><span className="text-[10px] font-black uppercase text-[#74837f]">Footer disclaimer</span><textarea value={footerText} onChange={(event) => { setFooterText(event.target.value); resetGeneratedPdf(); }} className="mt-2 min-h-[64px] w-full rounded-md border border-[#dce9e5] p-3 text-[11px] font-semibold" /></label>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-[#dce9e5] bg-white">
            <div className="flex items-center justify-between border-b border-[#e7efed] p-3"><div><h2 className="text-[14px] font-black text-[#17222b]">PDF preview</h2><p className="mt-1 text-[10px] font-semibold text-[#74837f]">Generate after changing document settings.</p></div>{previewUrl ? <span className="rounded bg-[#eaf9f2] px-2 py-1 text-[9px] font-black text-[#087766]">READY</span> : null}</div>
            {previewUrl ? <iframe title="Generated lab report PDF preview" src={previewUrl} className="h-[680px] w-full bg-[#eef3f2]" /> : <div className="grid h-[260px] place-items-center bg-[#f8fbfa] p-5 text-center"><div><p className="text-[13px] font-black text-[#31534d]">No PDF generated yet</p><p className="mt-2 text-[10px] font-semibold text-[#74837f]">Select a report, customize it and generate the preview.</p></div></div>}
          </section>
        </div>
      </div>
    </LabShell>
  );
}

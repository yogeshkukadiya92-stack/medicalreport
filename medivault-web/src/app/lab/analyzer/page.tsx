"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import { parseAnalyzerBatch, type AnalyzerBatchRow } from "@/lib/analyzer-import";
import { localDateKey } from "@/lib/date-client";
import { normalizePhone, statusFromValue } from "@/lib/lab-utils";
import type { LabClient, ReportMarker } from "@/lib/vault-types";

type Mapping = {
  id: string;
  analyzerName: string;
  testCode: string;
  testName: string;
  unit?: string;
  referenceRange?: string;
  updatedAt: string;
};

type BatchHistory = {
  id: string;
  fileName: string;
  analyzerName: string;
  groupCount: number;
  resultCount: number;
  publishedCount: number;
  failedCount: number;
  status: "review" | "partial" | "published";
  createdAt: string;
};

type ImportGroup = {
  id: string;
  accessionNumber: string;
  clientName: string;
  clientPhone: string;
  reportDate: string;
  reportType: string;
  rows: AnalyzerBatchRow[];
  selected: boolean;
  state: "ready" | "needs_details" | "publishing" | "published" | "failed";
  error?: string;
};

const emptyMapping = { analyzerName: "Default analyzer", testCode: "", testName: "", unit: "", referenceRange: "" };

function cleanDate(value: string) {
  if (!value) return localDateKey();
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parts = value.split(/[./-]/).map((part) => part.trim());
  if (parts.length === 3 && parts[0].length <= 2) {
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return localDateKey();
}

function groupRows(rows: AnalyzerBatchRow[], clients: LabClient[]): ImportGroup[] {
  const grouped = new Map<string, AnalyzerBatchRow[]>();
  rows.forEach((row, index) => {
    const phone = normalizePhone(row.clientPhone);
    const key = row.accessionNumber || (phone ? `${phone}|${row.reportType || "Analyzer"}` : `unmatched-${index}`);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  });

  return Array.from(grouped.entries()).map(([key, group]) => {
    const first = group[0];
    const phone = normalizePhone(first.clientPhone);
    const linked = clients.find((client) => phone && client.normalizedPhone === phone);
    const clientName = first.clientName || linked?.name || "";
    const clientPhone = first.clientPhone || linked?.phone || "";
    return {
      id: key,
      accessionNumber: first.accessionNumber,
      clientName,
      clientPhone,
      reportDate: cleanDate(first.reportDate),
      reportType: first.reportType || "Analyzer Panel",
      rows: group,
      selected: Boolean(clientName && normalizePhone(clientPhone).length >= 8),
      state: clientName && normalizePhone(clientPhone).length >= 8 ? "ready" : "needs_details",
    };
  });
}

export default function LabAnalyzerPage() {
  const { session } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [history, setHistory] = useState<BatchHistory[]>([]);
  const [clients, setClients] = useState<LabClient[]>([]);
  const [mappingForm, setMappingForm] = useState(emptyMapping);
  const [analyzerName, setAnalyzerName] = useState("Default analyzer");
  const [groups, setGroups] = useState<ImportGroup[]>([]);
  const [batchId, setBatchId] = useState("");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const headers = useMemo(() => {
    if (!session?.access_token) return null;
    return { Authorization: `Bearer ${session.access_token}` };
  }, [session?.access_token]);

  async function loadData() {
    if (!headers) return;
    setIsLoading(true);
    try {
      const [analyzerResponse, clientResponse] = await Promise.all([
        fetch("/api/lab/analyzer", { headers }),
        fetch("/api/lab/clients", { headers }),
      ]);
      const [analyzerResult, clientResult] = await Promise.all([
        analyzerResponse.json().catch(() => null),
        clientResponse.json().catch(() => null),
      ]);
      if (!analyzerResponse.ok) throw new Error(analyzerResult?.error ?? "Analyzer setup could not be loaded.");
      if (!clientResponse.ok) throw new Error(clientResult?.error ?? "Clients could not be loaded.");
      setMappings(analyzerResult?.mappings ?? []);
      setHistory(analyzerResult?.batches ?? []);
      setClients(clientResult?.clients ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Analyzer setup could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [headers]);

  async function apiAction(payload: Record<string, unknown>) {
    if (!headers) throw new Error("Sign in again to continue.");
    const response = await fetch("/api/lab/analyzer", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error ?? "Analyzer action failed.");
    return result;
  }

  async function saveMapping(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiAction({ action: "save_mapping", ...mappingForm });
      setMappingForm((current) => ({ ...emptyMapping, analyzerName: current.analyzerName }));
      setMessage("Analyzer test mapping saved.");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Mapping could not be saved.");
    }
  }

  async function deleteMapping(id: string) {
    setError("");
    try {
      await apiAction({ action: "delete_mapping", id });
      setMappings((current) => current.filter((mapping) => mapping.id !== id));
      setMessage("Mapping removed.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Mapping could not be removed.");
    }
  }

  async function importFile(file: File | null) {
    if (!file) return;
    setError("");
    setMessage("");
    setGroups([]);
    setBatchId("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Bulk analyzer file must be smaller than 5 MB.");
      const activeMappings = mappings.filter((mapping) => mapping.analyzerName === analyzerName);
      const map = Object.fromEntries(activeMappings.map((mapping) => [mapping.testCode.toUpperCase(), mapping.testName]));
      const rows = parseAnalyzerBatch(await file.text(), map).map((row) => {
        const mapping = activeMappings.find((item) => item.testCode.toUpperCase() === row.code.toUpperCase());
        return {
          ...row,
          unit: mapping?.unit || row.unit,
          referenceRange: mapping?.referenceRange || row.referenceRange,
        };
      });
      if (!rows.length) {
        throw new Error("No results found. Bulk CSV needs accession/phone details plus code or test and value columns.");
      }
      if (rows.length > 10000) throw new Error("One import can contain maximum 10,000 result rows.");
      const nextGroups = groupRows(rows, clients);
      const result = await apiAction({
        action: "save_batch",
        analyzerName,
        fileName: file.name,
        groupCount: nextGroups.length,
        resultCount: rows.length,
      });
      setGroups(nextGroups);
      setBatchId(result.batch.id);
      setFileName(file.name);
      setMessage(`${rows.length} results grouped into ${nextGroups.length} patient reports. Review before publishing.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Analyzer batch could not be imported.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function updateGroup(id: string, patch: Partial<ImportGroup>) {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== id) return group;
        const next = { ...group, ...patch };
        const valid = Boolean(next.clientName.trim() && normalizePhone(next.clientPhone).length >= 8);
        if (next.state !== "published" && next.state !== "failed" && next.state !== "publishing") {
          next.state = valid ? "ready" : "needs_details";
          if (!valid) next.selected = false;
        }
        return next;
      }),
    );
  }

  async function publishSelected() {
    if (!headers || !batchId) return;
    const selected = groups.filter((group) => group.selected && group.state === "ready");
    if (!selected.length) {
      setError("Select at least one ready patient report.");
      return;
    }
    setIsPublishing(true);
    setError("");
    setMessage("");
    let publishedCount = 0;
    let failedCount = 0;

    for (const group of selected) {
      updateGroup(group.id, { state: "publishing", error: undefined });
      try {
        const values = group.rows.map((row) => ({
          name: row.name,
          value: row.value,
          unit: row.unit,
          referenceRange: row.referenceRange,
          status: row.status === "Watch" ? statusFromValue(row.value, row.referenceRange) : row.status,
          notes: row.notes || (row.code ? `Analyzer code: ${row.code}` : ""),
        }));
        const response = await fetch("/api/lab/records", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            accessionNumber: group.accessionNumber,
            client: { name: group.clientName, phone: group.clientPhone },
            reportDate: group.reportDate,
            reportType: group.reportType,
            title: `${group.reportType} - ${group.clientName}`,
            values,
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error ?? "Report could not be published.");
        publishedCount += 1;
        updateGroup(group.id, { state: "published", selected: false });
      } catch (publishError) {
        failedCount += 1;
        updateGroup(group.id, {
          state: "failed",
          error: publishError instanceof Error ? publishError.message : "Publish failed.",
        });
      }
    }

    try {
      await apiAction({ action: "complete_batch", id: batchId, publishedCount, failedCount });
      setMessage(`${publishedCount} reports published${failedCount ? ` · ${failedCount} need correction` : ""}.`);
      await loadData();
    } catch {
      setMessage(`${publishedCount} reports published. Batch history could not be updated.`);
    } finally {
      setIsPublishing(false);
    }
  }

  function downloadSample() {
    const sample = [
      "accession,patient_name,mobile,report_type,report_date,code,value,unit,reference_range,flag,notes",
      "ACC-1001,Rahul Patel,9876543210,CBC,2026-07-25,HGB,15.2,g/dL,13.0-17.0,N,",
      "ACC-1001,Rahul Patel,9876543210,CBC,2026-07-25,WBC,12500,cells/uL,4000-11000,H,Review",
      "ACC-1002,Neha Shah,9988776655,Thyroid,2026-07-25,TSH,3.1,uIU/mL,0.4-4.0,N,",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([sample], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "medivault-analyzer-import-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const readyCount = groups.filter((group) => group.state === "ready").length;
  const selectedCount = groups.filter((group) => group.selected && group.state === "ready").length;
  const analyzerOptions = Array.from(new Set(["Default analyzer", ...mappings.map((mapping) => mapping.analyzerName)]));

  return (
    <LabShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0d8a70]">Analyzer automation</p>
          <h1 className="mt-1 text-[24px] font-black text-[#17222b]">Import inbox & mappings</h1>
          <p className="mt-1 text-[11px] font-semibold text-[#74837f]">Map machine codes once, then publish multi-patient result files with a controlled review step.</p>
        </div>
        <button type="button" onClick={downloadSample} className="h-9 rounded-md border border-[#b8d4cc] bg-white px-4 text-[11px] font-black text-[#0d5c46]">
          Download sample CSV
        </button>
      </header>

      {message ? <p className="mt-3 rounded-md bg-[#eaf9f2] p-3 text-[11px] font-bold text-[#087766]">{message}</p> : null}
      {error ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-[11px] font-bold text-[#ba563d]">{error}</p> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="min-w-0 space-y-4">
          <div className="rounded-md border border-[#dbe6e3] bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
              <label>
                <span className="mb-1 block text-[10px] font-black uppercase text-[#74837f]">Analyzer</span>
                <select value={analyzerName} onChange={(event) => setAnalyzerName(event.target.value)} className="clinical-field">
                  {analyzerOptions.map((name) => <option key={name}>{name}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[10px] font-black uppercase text-[#74837f]">Bulk result file</span>
                <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={(event) => void importFile(event.target.files?.[0] ?? null)} className="w-full rounded-md border border-dashed border-[#9fc9bd] bg-[#f4fbf8] p-2 text-[11px] font-bold text-[#52605d]" />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#60716d]">
              <span className="rounded bg-[#eef4f2] px-2 py-1">CSV / TSV / TXT</span>
              <span className="rounded bg-[#eef4f2] px-2 py-1">Maximum 10,000 results</span>
              <span className="rounded bg-[#eef4f2] px-2 py-1">Grouped by accession or phone</span>
              {fileName ? <span className="truncate text-[#0d5c46]">{fileName}</span> : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
            <div className="flex flex-col gap-2 border-b border-[#e7efed] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[14px] font-black text-[#17222b]">Patient report review</h2>
                <p className="mt-0.5 text-[10px] font-bold text-[#74837f]">{groups.length} groups · {readyCount} ready · {selectedCount} selected</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setGroups((current) => current.map((group) => ({ ...group, selected: group.state === "ready" })))} className="h-8 rounded-md border border-[#b8d4cc] px-3 text-[10px] font-black text-[#0d5c46]">Select ready</button>
                <button type="button" disabled={isPublishing || !selectedCount} onClick={() => void publishSelected()} className="h-8 rounded-md bg-[#0d5c46] px-3 text-[10px] font-black text-white disabled:opacity-50">{isPublishing ? "Publishing..." : `Publish ${selectedCount}`}</button>
              </div>
            </div>

            {!groups.length ? (
              <div className="grid min-h-[260px] place-items-center p-6 text-center">
                <div><p className="text-[13px] font-black text-[#33413e]">{isLoading ? "Loading analyzer workspace..." : "No batch in review"}</p><p className="mt-1 text-[10px] font-semibold text-[#85938f]">Upload a machine export to create patient report groups.</p></div>
              </div>
            ) : (
              <div className="divide-y divide-[#e7efed]">
                {groups.map((group) => (
                  <article key={group.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={group.selected} disabled={group.state !== "ready"} onChange={(event) => updateGroup(group.id, { selected: event.target.checked })} className="mt-2 h-4 w-4 accent-[#0d8a70]" />
                      <div className="min-w-0 flex-1">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
                          <input value={group.clientName} onChange={(event) => updateGroup(group.id, { clientName: event.target.value })} className="clinical-field" placeholder="Patient name" />
                          <input value={group.clientPhone} onChange={(event) => updateGroup(group.id, { clientPhone: event.target.value })} className="clinical-field" placeholder="Mobile number" />
                          <input value={group.reportType} onChange={(event) => updateGroup(group.id, { reportType: event.target.value })} className="clinical-field" placeholder="Report type" />
                          <input type="date" value={group.reportDate} onChange={(event) => updateGroup(group.id, { reportDate: event.target.value })} className="clinical-field" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-bold">
                          <span className="rounded bg-[#eef4f2] px-2 py-1">{group.accessionNumber || "No accession"}</span>
                          <span className="rounded bg-[#eef4f2] px-2 py-1">{group.rows.length} results</span>
                          <span className={`rounded px-2 py-1 ${group.state === "published" ? "bg-[#eaf9f2] text-[#087766]" : group.state === "failed" || group.state === "needs_details" ? "bg-[#fff0ec] text-[#ba563d]" : "bg-[#fff7d8] text-[#8a6500]"}`}>{group.state.replace("_", " ")}</span>
                          {group.error ? <span className="text-[#ba563d]">{group.error}</span> : null}
                        </div>
                        <p className="mt-2 line-clamp-2 text-[10px] font-semibold text-[#6f7e7a]">{group.rows.map((row) => `${row.name}: ${row.value} ${row.unit}`).join(" · ")}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-md border border-[#dbe6e3] bg-white">
            <div className="border-b border-[#e7efed] px-4 py-3"><h2 className="text-[14px] font-black text-[#17222b]">Test-code mapping</h2><p className="mt-0.5 text-[10px] font-bold text-[#74837f]">Saved per analyzer and reused on every import.</p></div>
            <form onSubmit={saveMapping} className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-1">
              <input value={mappingForm.analyzerName} onChange={(event) => setMappingForm((current) => ({ ...current, analyzerName: event.target.value }))} className="clinical-field" placeholder="Analyzer name" required />
              <div className="grid grid-cols-2 gap-2">
                <input value={mappingForm.testCode} onChange={(event) => setMappingForm((current) => ({ ...current, testCode: event.target.value }))} className="clinical-field uppercase" placeholder="Machine code" required />
                <input value={mappingForm.testName} onChange={(event) => setMappingForm((current) => ({ ...current, testName: event.target.value }))} className="clinical-field" placeholder="MediVault parameter" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={mappingForm.unit} onChange={(event) => setMappingForm((current) => ({ ...current, unit: event.target.value }))} className="clinical-field" placeholder="Default unit" />
                <input value={mappingForm.referenceRange} onChange={(event) => setMappingForm((current) => ({ ...current, referenceRange: event.target.value }))} className="clinical-field" placeholder="Default range" />
              </div>
              <button className="h-9 rounded-md bg-[#0d5c46] text-[11px] font-black text-white">Save mapping</button>
            </form>
            <div className="max-h-[320px] divide-y divide-[#e7efed] overflow-y-auto border-t border-[#e7efed]">
              {mappings.length ? mappings.map((mapping) => (
                <div key={mapping.id} className="flex items-center gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black text-[#25322f]">{mapping.testCode} → {mapping.testName}</p><p className="mt-0.5 truncate text-[9px] font-bold text-[#82908c]">{mapping.analyzerName}{mapping.unit ? ` · ${mapping.unit}` : ""}{mapping.referenceRange ? ` · ${mapping.referenceRange}` : ""}</p></div>
                  <button type="button" onClick={() => void deleteMapping(mapping.id)} className="text-[10px] font-black text-[#ba563d]">Remove</button>
                </div>
              )) : <p className="p-4 text-[10px] font-semibold text-[#82908c]">Common CBC, thyroid, diabetes and lipid codes work by default. Add machine-specific codes here.</p>}
            </div>
          </section>

          <section className="rounded-md border border-[#dbe6e3] bg-white">
            <div className="border-b border-[#e7efed] px-4 py-3"><h2 className="text-[14px] font-black text-[#17222b]">Import history</h2></div>
            <div className="divide-y divide-[#e7efed]">
              {history.length ? history.slice(0, 8).map((batch) => (
                <div key={batch.id} className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-[10px] font-black text-[#33413e]">{batch.fileName}</p><span className="text-[9px] font-black uppercase text-[#0d8a70]">{batch.status}</span></div>
                  <p className="mt-1 text-[9px] font-bold text-[#82908c]">{batch.groupCount} reports · {batch.resultCount} results · {batch.publishedCount} published{batch.failedCount ? ` · ${batch.failedCount} failed` : ""}</p>
                </div>
              )) : <p className="p-4 text-[10px] font-semibold text-[#82908c]">No analyzer imports yet.</p>}
            </div>
          </section>
        </aside>
      </div>
    </LabShell>
  );
}

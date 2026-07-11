"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import { localDateKey } from "@/lib/date-client";
import { getLabTemplate } from "@/lib/lab-templates";
import { normalizePhone, statusFromValue } from "@/lib/lab-utils";
import type { LabClient, LabReport, LabTemplate, ReportMarker } from "@/lib/vault-types";

type BuilderMode = "template" | "custom" | "attachment";

type ValueDraft = {
  id: string;
  name: string;
  notes: string;
  referenceRange: string;
  status: ReportMarker["status"];
  unit: string;
  value: string;
};

type StoredFile = {
  fileId: string;
  fileMimeType: string;
  fileName: string;
  fileSizeBytes: number;
};

const emptyClient = { age: "", gender: "", name: "", phone: "" };
const createEmptyReport = () => ({
  accessionNumber: "",
  doctorName: "",
  reportDate: localDateKey(),
  reportType: "CBC",
  sampleCollectedAt: "",
  title: "",
});

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function draftFromTemplate(templateId: string): ValueDraft[] {
  return getLabTemplate(templateId).tests.map((test) => ({
    id: newId(),
    name: test.name,
    notes: "",
    referenceRange: test.referenceRange,
    status: "Watch",
    unit: test.unit,
    value: "",
  }));
}

function emptyValue(): ValueDraft {
  return {
    id: newId(),
    name: "",
    notes: "",
    referenceRange: "",
    status: "Watch",
    unit: "",
    value: "",
  };
}

function statusStyles(status: ReportMarker["status"]) {
  if (status === "High" || status === "Low") return "bg-[#fff0ec] text-[#ba563d]";
  if (status === "Watch") return "bg-[#fff7d8] text-[#8a6500]";
  return "bg-[#eaf9f2] text-[#087766]";
}

export default function LabCreateReportPage() {
  const { isConfigured, session, status } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<BuilderMode>("template");
  const [templates, setTemplates] = useState<LabTemplate[]>([]);
  const [clients, setClients] = useState<LabClient[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("cbc");
  const [clientForm, setClientForm] = useState(emptyClient);
  const [reportForm, setReportForm] = useState(createEmptyReport);
  const [values, setValues] = useState<ValueDraft[]>(draftFromTemplate("cbc"));
  const [storedFile, setStoredFile] = useState<StoredFile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [hasAppliedUrlPrefill, setHasAppliedUrlPrefill] = useState(false);

  async function loadInitialData() {
    if (!isConfigured) {
      setIsInitialDataLoaded(true);
      return;
    }
    if (status === "loading") return;
    if (!session?.access_token) {
      setIsInitialDataLoaded(true);
      return;
    }
    const headers = { Authorization: `Bearer ${session.access_token}` };
    setError("");
    try {
      const [templateResponse, clientResponse, reportResponse] = await Promise.all([
        fetch("/api/lab/templates", { headers }),
        fetch("/api/lab/clients", { headers }),
        fetch("/api/lab/records", { headers }),
      ]);
      const [templateResult, clientResult, reportResult] = await Promise.all([
        templateResponse.json().catch(() => null),
        clientResponse.json().catch(() => null),
        reportResponse.json().catch(() => null),
      ]);
      if (templateResponse.ok) setTemplates(templateResult?.templates ?? []);
      if (clientResponse.ok) setClients(clientResult?.clients ?? []);
      if (reportResponse.ok) setReports(reportResult?.reports ?? []);
      if (!templateResponse.ok || !clientResponse.ok || !reportResponse.ok) {
        setError("Lab setup data could not be fully loaded. Refresh after sign-in and try again.");
      }
    } catch {
      setError("Lab setup data could not be loaded. Refresh after sign-in, or allow this site in any browser content blocker.");
    } finally {
      setIsInitialDataLoaded(true);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [isConfigured, session?.access_token, status]);

  const duplicateReport = useMemo(() => {
    const normalizedPhone = normalizePhone(clientForm.phone);
    if (!normalizedPhone || !reportForm.reportType || !reportForm.reportDate) return null;
    return reports.find(
      (report) =>
        report.normalizedClientPhone === normalizedPhone &&
        report.reportType === reportForm.reportType &&
        report.reportDate === reportForm.reportDate,
    );
  }, [clientForm.phone, reportForm.reportDate, reportForm.reportType, reports]);

  const summary = useMemo(() => {
    const completeValues = values.filter((value) => value.name.trim() && value.value.trim());
    const flagged = completeValues.filter((value) => value.status !== "Normal").length;
    return { complete: completeValues.length, flagged };
  }, [values]);

  useEffect(() => {
    if (!isInitialDataLoaded || hasAppliedUrlPrefill || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template") ?? "";
    const clientId = params.get("clientId") ?? "";
    const phone = params.get("phone") ?? "";
    const accessionNumber = params.get("accession") ?? "";

    if (accessionNumber) {
      setReportForm((current) => ({ ...current, accessionNumber }));
    }

    if (templateId) {
      const template = templates.find((item) => item.id === templateId) ?? getLabTemplate(templateId);
      setMode("template");
      setSelectedTemplateId(template.id);
      setReportForm((current) => ({ ...current, reportType: template.name, title: `${template.name} Report` }));
      setValues(template.tests.length ? draftFromTemplate(template.id) : [emptyValue()]);
    }

    if (clientId || phone) {
      const normalizedPhone = normalizePhone(phone);
      const linkedClient = clients.find((client) => client.id === clientId || (normalizedPhone && client.normalizedPhone === normalizedPhone));
      if (linkedClient) {
        setSelectedClientId(linkedClient.id);
        setClientForm({
          age: linkedClient.age ? String(linkedClient.age) : "",
          gender: linkedClient.gender ?? "",
          name: linkedClient.name,
          phone: linkedClient.phone,
        });
      } else if (phone) {
        setClientForm((current) => ({ ...current, phone }));
      }
    }

    setHasAppliedUrlPrefill(true);
  }, [clients, hasAppliedUrlPrefill, isInitialDataLoaded, templates]);

  function selectClient(clientId: string) {
    setSelectedClientId(clientId);
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;
    setClientForm({
      age: client.age ? String(client.age) : "",
      gender: client.gender ?? "",
      name: client.name,
      phone: client.phone,
    });
  }

  function selectTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId) ?? getLabTemplate(templateId);
    setSelectedTemplateId(template.id);
    setReportForm((current) => ({ ...current, reportType: template.name, title: `${template.name} Report` }));
    setValues(template.tests.length ? draftFromTemplate(template.id) : [emptyValue()]);
  }

  function updateValue(id: string, patch: Partial<ValueDraft>) {
    setValues((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if ("value" in patch || "referenceRange" in patch) {
          next.status = statusFromValue(next.value, next.referenceRange);
        }
        return next;
      }),
    );
  }

  async function uploadAttachment() {
    const file = inputRef.current?.files?.[0] ?? null;
    if (!file || !session?.access_token) return null;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/files", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result?.error ?? "Original file could not be stored.");
    }
    return result as StoredFile;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) return;
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const uploadedFile = storedFile ?? (inputRef.current?.files?.[0] ? await uploadAttachment() : null);
      if (uploadedFile) setStoredFile(uploadedFile);

      const response = await fetch("/api/lab/records", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...reportForm,
          client: clientForm,
          fileId: uploadedFile?.fileId,
          fileMimeType: uploadedFile?.fileMimeType,
          fileName: uploadedFile?.fileName,
          fileSizeBytes: uploadedFile?.fileSizeBytes,
          values: values.map(({ id: _id, ...value }) => value),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "Report could not be saved.");
      }

      setMessage(result?.duplicateWarning ?? "Report published to matching client app.");
      setSelectedClientId("");
      setClientForm(emptyClient);
      setReportForm(createEmptyReport());
      setSelectedTemplateId("cbc");
      setValues(draftFromTemplate("cbc"));
      setStoredFile(null);
      if (inputRef.current) inputRef.current.value = "";
      loadInitialData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Report could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <LabShell>
      <form onSubmit={handleSubmit}>
        <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-black text-[#17222b]">Create lab report</h1>
                <span className="rounded border border-[#cfe0dc] bg-white px-2 py-1 text-[10px] font-black text-[#64748b]">DRAFT</span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold text-[#7b8b88]">Clinical entry workspace · changes are kept while this page stays open</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden grid-cols-3 rounded-md border border-[#d7e4e0] bg-white p-0.5 md:grid">
          {[
            ["template", "Template"],
            ["custom", "Custom"],
            ["attachment", "Attachment"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value as BuilderMode);
                if (value === "custom" && !values.length) setValues([emptyValue()]);
              }}
                  className={`h-8 rounded px-3 text-[11px] font-bold ${mode === value ? "bg-[#e0f5ef] text-[#0d5c46]" : "text-[#65716f]"}`}
            >
              {label}
            </button>
          ))}
            </div>
            <button disabled={isSaving} className="h-9 rounded-md bg-[#0d5c46] px-4 text-[12px] font-black text-white shadow-[0_4px_12px_rgba(13,92,70,0.16)] hover:bg-[#0a4938] disabled:opacity-60">
              {isSaving ? "Publishing..." : "Verify & publish"}
            </button>
          </div>
        </header>

        <div className="mt-4 grid min-w-0 gap-3 min-[1050px]:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
              <div className="border-b border-[#e7efed] bg-[#f8fbfa] px-3 py-2.5">
                <h2 className="text-[12px] font-black text-[#17222b]">Patient & order</h2>
              </div>
              <div className="space-y-2 p-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-black uppercase text-[#74837f]">Find client</span>
              <select
                value={selectedClientId}
                onChange={(event) => selectClient(event.target.value)}
                    className="clinical-field"
              >
                <option value="">New client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
            </label>
              <input
                value={clientForm.name}
                onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))}
                  className="clinical-field"
                placeholder="Client name"
              />
              <input
                value={clientForm.phone}
                onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))}
                  className="clinical-field"
                placeholder="Phone"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={clientForm.age}
                  onChange={(event) => setClientForm((current) => ({ ...current, age: event.target.value }))}
                    className="clinical-field"
                  placeholder="Age"
                />
                <input
                  value={clientForm.gender}
                  onChange={(event) => setClientForm((current) => ({ ...current, gender: event.target.value }))}
                    className="clinical-field"
                  placeholder="Gender"
                />
              </div>
                <div className="my-3 h-px bg-[#e7efed]" />
                <p className="text-[10px] font-black uppercase text-[#74837f]">Order details</p>
                <input value={reportForm.accessionNumber} onChange={(event) => setReportForm((current) => ({ ...current, accessionNumber: event.target.value }))} className="clinical-field" placeholder="Accession number" />
                <input value={reportForm.doctorName} onChange={(event) => setReportForm((current) => ({ ...current, doctorName: event.target.value }))} className="clinical-field" placeholder="Ordering doctor" />
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-[#74837f]">Sample collected</span>
                  <input type="datetime-local" value={reportForm.sampleCollectedAt} onChange={(event) => setReportForm((current) => ({ ...current, sampleCollectedAt: event.target.value }))} className="clinical-field" />
                </label>
              </div>
            </section>

            <section className="rounded-md border border-[#dbe6e3] bg-white p-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-black text-[#17222b]">Attachment</h2>
                <span className="text-[10px] font-bold text-[#879590]">PDF / image</span>
              </div>
              <input ref={inputRef} type="file" accept="application/pdf,image/*" className="mt-2 w-full rounded-md border border-dashed border-[#bfcfcb] bg-[#f8fbfa] p-2 text-[10px] font-bold text-[#52605d]" />
              {storedFile ? <p className="mt-2 rounded bg-[#eaf9f2] p-2 text-[10px] font-bold text-[#087766]">{storedFile.fileName} stored.</p> : null}
            </section>

            <section className="rounded-md bg-[#0d5c46] p-3 text-white">
              <div className="flex items-end justify-between">
                <div><p className="text-[9px] font-black uppercase text-[#99f6e4]">Completion</p><p className="mt-1 text-[20px] font-black">{summary.complete}/{values.length}</p></div>
                <p className="text-[11px] font-bold text-white/70">{summary.flagged} flagged</p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-[#2dd4bf]" style={{ width: `${values.length ? (summary.complete / values.length) * 100 : 0}%` }} /></div>
            </section>
          </aside>

          <section className="min-w-0 space-y-3">
            <section className="rounded-md border border-[#dbe6e3] bg-white p-3">
              <div className="grid gap-2 md:grid-cols-2 min-[1050px]:grid-cols-[1fr_1.25fr_0.8fr_0.85fr]">
            {mode === "template" ? (
                  <label className="block"><span className="mb-1 block text-[10px] font-black uppercase text-[#74837f]">Template</span>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => selectTemplate(event.target.value)}
                      className="clinical-field"
                >
                  {(templates.length ? templates : [getLabTemplate("cbc")]).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
                ) : <input value={reportForm.reportType} onChange={(event) => setReportForm((current) => ({ ...current, reportType: event.target.value }))} className="clinical-field self-end" placeholder="Report type" />}
                <label><span className="mb-1 block text-[10px] font-black uppercase text-[#74837f]">Report title</span>
              <input
                value={reportForm.title}
                onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))}
                    className="clinical-field"
                placeholder="Report title"
              />
                </label>
                <label><span className="mb-1 block text-[10px] font-black uppercase text-[#74837f]">Report date</span>
              <input
                type="date"
                value={reportForm.reportDate}
                onChange={(event) => setReportForm((current) => ({ ...current, reportDate: event.target.value }))}
                    className="clinical-field"
              />
                </label>
                <label><span className="mb-1 block text-[10px] font-black uppercase text-[#74837f]">Report type</span><input value={reportForm.reportType} onChange={(event) => setReportForm((current) => ({ ...current, reportType: event.target.value }))} className="clinical-field" placeholder="Report type" /></label>
            </div>
          </section>

            <section className="min-w-0 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
              <div className="flex items-center justify-between border-b border-[#e7efed] px-3 py-2.5">
            <div>
                  <h2 className="text-[13px] font-black text-[#17222b]">{reportForm.reportType || "Report values"}</h2>
                  <p className="mt-0.5 text-[10px] font-bold text-[#7b8986]">{summary.complete} entered · {summary.flagged} require review</p>
            </div>
                <button type="button" onClick={() => setValues((current) => [...current, emptyValue()])} className="h-8 rounded-md border border-[#b8d4cc] px-3 text-[11px] font-black text-[#0d5c46] hover:bg-[#eff8f5]">
                  + Add parameter
            </button>
          </div>

              <div className="hidden border-b border-[#dfe9e6] bg-[#f7faf9] px-2 py-2 text-[9px] font-black uppercase text-[#74837f] min-[1050px]:grid min-[1050px]:grid-cols-[22px_2fr_56px_62px_82px_76px_52px_22px] min-[1050px]:gap-1.5">
                <span>#</span><span>Parameter</span>
            <span>Value</span>
                <span>Unit</span><span>Reference</span><span>Status</span><span>Notes</span><span />
          </div>

              <div className="divide-y divide-[#e7efed]">
            {values.map((item, index) => (
                  <div key={item.id} className={`relative p-2 ${item.status === "Normal" ? "border-l-2 border-l-[#22a06b]" : item.status === "Watch" ? "border-l-2 border-l-[#eab308]" : "border-l-2 border-l-[#ef654f]"}`}>
                    <div className="grid min-w-0 gap-2 sm:grid-cols-2 min-[1050px]:grid-cols-[20px_2fr_56px_62px_82px_76px_52px_20px] min-[1050px]:items-center min-[1050px]:gap-1.5">
                      <p className="hidden text-[10px] font-black text-[#8a9894] min-[1050px]:block">{index + 1}</p>
                      <div className="col-span-2 flex items-center justify-between min-[1050px]:hidden"><p className="text-[11px] font-black text-[#17222b]">Parameter {index + 1}</p>
                    {values.length > 1 ? (
                          <button type="button" onClick={() => setValues((current) => current.filter((value) => value.id !== item.id))} className="text-[10px] font-bold text-[#ba563d]">
                        Remove
                      </button>
                    ) : null}
                  </div>
                      <input value={item.name} onChange={(event) => updateValue(item.id, { name: event.target.value })} className="clinical-field clinical-cell" placeholder="Test name" />
                      <input value={item.value} onChange={(event) => updateValue(item.id, { value: event.target.value })} className="clinical-field clinical-cell" placeholder="Value" />
                      <input value={item.unit} onChange={(event) => updateValue(item.id, { unit: event.target.value })} className="clinical-field clinical-cell" placeholder="Unit" />
                      <input value={item.referenceRange} onChange={(event) => updateValue(item.id, { referenceRange: event.target.value })} className="clinical-field clinical-cell" placeholder="Reference range" />
                      <select value={item.status} onChange={(event) => updateValue(item.id, { status: event.target.value as ReportMarker["status"] })} className={`clinical-field clinical-cell ${statusStyles(item.status)}`}>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Low</option>
                    <option>Watch</option>
                  </select>
                      <input value={item.notes} onChange={(event) => updateValue(item.id, { notes: event.target.value })} className="clinical-field clinical-cell" placeholder="Notes" />
                  {values.length > 1 ? (
                        <button type="button" title="Remove parameter" onClick={() => setValues((current) => current.filter((value) => value.id !== item.id))} className="hidden h-8 text-[18px] font-bold text-[#ba563d] min-[1050px]:block">
                          ×
                    </button>
                  ) : (
                        <span className="hidden min-[1050px]:block" />
                  )}
                </div>
              </div>
            ))}
          </div>

              <div className="border-t border-[#dfe9e6] bg-[#f8fbfa] p-3">
            {duplicateReport ? (
                  <p className="mb-2 rounded bg-[#fff7d8] p-2 text-[11px] font-bold text-[#8a6500]">
                Duplicate warning: {duplicateReport.reportType} already exists for this phone on {duplicateReport.reportDate}.
              </p>
            ) : null}
                {message ? <p className="mb-2 rounded bg-[#eaf9f2] p-2 text-[11px] font-bold text-[#087766]">{message}</p> : null}
                {error ? <p className="mb-2 rounded bg-[#fff0ec] p-2 text-[11px] font-bold text-[#ba563d]">{error}</p> : null}
                <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold text-[#74837f]">Status colors update automatically from reference ranges.</p><button disabled={isSaving} className="h-9 shrink-0 rounded-md bg-[#0d5c46] px-4 text-[11px] font-black text-white disabled:opacity-60">{isSaving ? "Publishing..." : "Verify & publish"}</button></div>
          </div>
        </section>
          </section>
        </div>
      </form>
    </LabShell>
  );
}

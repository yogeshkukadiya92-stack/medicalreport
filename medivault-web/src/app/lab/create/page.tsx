"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
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
const emptyReport = {
  accessionNumber: "",
  doctorName: "",
  reportDate: new Date().toISOString().slice(0, 10),
  reportType: "CBC",
  sampleCollectedAt: "",
  title: "",
};

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
  const [reportForm, setReportForm] = useState(emptyReport);
  const [values, setValues] = useState<ValueDraft[]>(draftFromTemplate("cbc"));
  const [storedFile, setStoredFile] = useState<StoredFile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadInitialData() {
    if (!isConfigured || status === "loading") return;
    if (!session?.access_token) return;
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
      setReportForm(emptyReport);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#087766]">Report builder</p>
          <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Create lab report</h1>
        </div>
        <div className="grid grid-cols-3 rounded-lg border border-[#dce9e5] bg-white p-1">
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
              className={`h-9 rounded-md px-3 text-[12px] font-bold ${mode === value ? "bg-[#102323] text-white" : "text-[#65716f]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-[#e2ebe8] bg-white p-4">
            <h2 className="text-[16px] font-black text-[#102323]">Client</h2>
            <label className="mt-4 block">
              <span className="text-[12px] font-bold text-[#52605d]">Select existing</span>
              <select
                value={selectedClientId}
                onChange={(event) => selectClient(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold"
              >
                <option value="">New client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid gap-3">
              <input
                value={clientForm.name}
                onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                placeholder="Client name"
              />
              <input
                value={clientForm.phone}
                onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                placeholder="Phone"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  value={clientForm.age}
                  onChange={(event) => setClientForm((current) => ({ ...current, age: event.target.value }))}
                  className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                  placeholder="Age"
                />
                <input
                  value={clientForm.gender}
                  onChange={(event) => setClientForm((current) => ({ ...current, gender: event.target.value }))}
                  className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                  placeholder="Gender"
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[#e2ebe8] bg-white p-4">
            <h2 className="text-[16px] font-black text-[#102323]">Report</h2>
            {mode === "template" ? (
              <label className="mt-4 block">
                <span className="text-[12px] font-bold text-[#52605d]">Template</span>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => selectTemplate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold"
                >
                  {(templates.length ? templates : [getLabTemplate("cbc")]).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="mt-3 grid gap-3">
              <input
                value={reportForm.title}
                onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                placeholder="Report title"
              />
              <input
                value={reportForm.reportType}
                onChange={(event) => setReportForm((current) => ({ ...current, reportType: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                placeholder="Report type"
              />
              <input
                type="date"
                value={reportForm.reportDate}
                onChange={(event) => setReportForm((current) => ({ ...current, reportDate: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
              />
              <input
                value={reportForm.accessionNumber}
                onChange={(event) => setReportForm((current) => ({ ...current, accessionNumber: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                placeholder="Accession number"
              />
              <input
                value={reportForm.doctorName}
                onChange={(event) => setReportForm((current) => ({ ...current, doctorName: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                placeholder="Doctor name"
              />
              <input
                type="datetime-local"
                value={reportForm.sampleCollectedAt}
                onChange={(event) => setReportForm((current) => ({ ...current, sampleCollectedAt: event.target.value }))}
                className="h-11 rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
              />
            </div>
          </section>

          <section className="rounded-lg border border-[#e2ebe8] bg-white p-4">
            <h2 className="text-[16px] font-black text-[#102323]">Attachment</h2>
            <input ref={inputRef} type="file" accept="application/pdf,image/*" className="mt-4 w-full rounded-lg border border-[#dce9e5] bg-white p-3 text-[13px] font-bold" />
            {storedFile ? <p className="mt-3 rounded-lg bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{storedFile.fileName} stored.</p> : null}
          </section>
        </aside>

        <section className="min-w-0 rounded-lg border border-[#e2ebe8] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#edf3f1] p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[16px] font-black text-[#102323]">Values</h2>
              <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{summary.complete} entered - {summary.flagged} flagged</p>
            </div>
            <button type="button" onClick={() => setValues((current) => [...current, emptyValue()])} className="h-10 rounded-lg border border-[#dce9e5] px-4 text-[12px] font-bold text-[#087766]">
              Add value
            </button>
          </div>

          <div className="space-y-3 p-4">
            {values.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-[#e2ebe8] bg-[#fbfdfc] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-black text-[#102323]">Value {index + 1}</p>
                  {values.length > 1 ? (
                    <button type="button" onClick={() => setValues((current) => current.filter((value) => value.id !== item.id))} className="text-[12px] font-bold text-[#ba563d]">
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2 lg:grid-cols-[1.3fr_0.8fr_0.7fr_1fr_130px]">
                  <input value={item.name} onChange={(event) => updateValue(item.id, { name: event.target.value })} className="h-10 rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold" placeholder="Test name" />
                  <input value={item.value} onChange={(event) => updateValue(item.id, { value: event.target.value })} className="h-10 rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold" placeholder="Value" />
                  <input value={item.unit} onChange={(event) => updateValue(item.id, { unit: event.target.value })} className="h-10 rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold" placeholder="Unit" />
                  <input value={item.referenceRange} onChange={(event) => updateValue(item.id, { referenceRange: event.target.value })} className="h-10 rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold" placeholder="Reference range" />
                  <select value={item.status} onChange={(event) => updateValue(item.id, { status: event.target.value as ReportMarker["status"] })} className={`h-10 rounded-lg border border-[#dce9e5] px-3 text-[12px] font-bold ${statusStyles(item.status)}`}>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Low</option>
                    <option>Watch</option>
                  </select>
                </div>
                <input value={item.notes} onChange={(event) => updateValue(item.id, { notes: event.target.value })} className="mt-2 h-10 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[13px] font-bold" placeholder="Notes" />
              </div>
            ))}
          </div>

          <div className="border-t border-[#edf3f1] p-4">
            {duplicateReport ? (
              <p className="mb-3 rounded-lg bg-[#fff7d8] p-3 text-[12px] font-bold text-[#8a6500]">
                Duplicate warning: {duplicateReport.reportType} already exists for this phone on {duplicateReport.reportDate}.
              </p>
            ) : null}
            {message ? <p className="mb-3 rounded-lg bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</p> : null}
            {error ? <p className="mb-3 rounded-lg bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</p> : null}
            <button disabled={isSaving} className="h-12 w-full rounded-lg bg-[#0a7d6e] text-[14px] font-bold text-white disabled:opacity-60">
              {isSaving ? "Publishing..." : "Save and publish"}
            </button>
          </div>
        </section>
      </form>
    </LabShell>
  );
}

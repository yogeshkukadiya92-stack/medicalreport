"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BodyCompositionShell } from "@/components/body-composition-shell";
import { CountryPhoneInput } from "@/components/country-phone-input";
import { emptyBodyValues, normalizedBodyMetric, type BodyValueDraft } from "@/lib/body-composition";
import { localDateKey } from "@/lib/date-client";
import { statusFromValue } from "@/lib/lab-utils";
import type { ReportMarker } from "@/lib/vault-types";
import { useBodyData } from "../_components/use-body-data";

type StoredFile = { fileId: string; fileMimeType: string; fileName?: string; fileSizeBytes: number };

function newValue(name = ""): BodyValueDraft {
  return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name, value: "", unit: "", referenceRange: "", status: "Watch" };
}

function splitValue(raw: string) {
  const match = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
  return match ? { value: match[1], unit: match[2].trim() } : { value: raw.trim(), unit: "" };
}

async function imageDataUrl(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image could not be read."));
      element.src = url;
    });
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function prepareForAi(file: File) {
  if (file.type.startsWith("image/")) return [await imageDataUrl(file)];
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, 1500 / Math.max(base.width, base.height)) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PDF rendering is unavailable.");
    await page.render({ canvasContext: context, viewport }).promise;
    return [canvas.toDataURL("image/jpeg", 0.82)];
  }
  throw new Error("Upload a JPG, PNG or PDF body-composition report.");
}

export default function CreateBodyCompositionPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { data, token } = useBodyData();
  const [mode, setMode] = useState<"manual" | "photo">("manual");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [client, setClient] = useState({ age: "", gender: "", name: "", phone: "" });
  const [reportDate, setReportDate] = useState(localDateKey());
  const [title, setTitle] = useState("BMI & Body Composition");
  const [summary, setSummary] = useState("");
  const [values, setValues] = useState<BodyValueDraft[]>(emptyBodyValues);
  const [storedFile, setStoredFile] = useState<StoredFile | null>(null);
  const [fileName, setFileName] = useState("");
  const [aiConfidence, setAiConfidence] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!data?.clients.length || typeof window === "undefined") return;
    const phone = new URLSearchParams(window.location.search).get("phone")?.replace(/\D/g, "").slice(-10);
    if (!phone || selectedClientId) return;
    const match = data.clients.find((item) => item.normalizedPhone === phone);
    if (match) selectClient(match.id);
  }, [data?.clients, selectedClientId]);

  function selectClient(id: string) {
    setSelectedClientId(id);
    const selected = data?.clients.find((item) => item.id === id);
    if (!selected) {
      setClient({ age: "", gender: "", name: "", phone: "" });
      return;
    }
    setClient({ age: selected.age ? String(selected.age) : "", gender: selected.gender ?? "", name: selected.name, phone: selected.phone });
  }

  function updateValue(id: string, patch: Partial<BodyValueDraft>) {
    setValues((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      if ("value" in patch || "referenceRange" in patch) next.status = statusFromValue(next.value, next.referenceRange);
      return next;
    }));
  }

  function calculateBmi() {
    const height = values.find((item) => normalizedBodyMetric(item.name) === "height");
    const weight = values.find((item) => normalizedBodyMetric(item.name) === "weight");
    const bmi = values.find((item) => normalizedBodyMetric(item.name) === "bmi");
    const heightCm = Number(height?.value);
    const weightKg = Number(weight?.value);
    if (!bmi || !heightCm || !weightKg) {
      setError("Enter Height and Weight first.");
      return;
    }
    updateValue(bmi.id, { value: (weightKg / ((heightCm / 100) ** 2)).toFixed(1) });
    setMessage("BMI calculated from current height and weight.");
  }

  async function storeFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/files", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error ?? "Original scan could not be stored.");
    return { ...result, fileName: file.name } as StoredFile;
  }

  async function analyzePhoto() {
    const file = fileRef.current?.files?.[0] ?? null;
    if (!file || !token) {
      setError("Select a body-composition photo or PDF first.");
      return;
    }
    setIsAnalyzing(true);
    setError("");
    setMessage("");
    try {
      const [dataUrls, stored] = await Promise.all([prepareForAi(file), storedFile ? Promise.resolve(storedFile) : storeFile(file)]);
      setStoredFile(stored);
      const response = await fetch("/api/analyze-report", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          fileDataUrls: dataUrls,
          fileName: file.name,
          lab: "Body Composition Center",
          memberName: client.name || "Client",
          mimeType: "image/jpeg",
          originalMimeType: file.type,
          reportKind: "body_composition",
          title,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Body scan analysis failed.");
      const markers = (Array.isArray(result?.markers) ? result.markers : []) as ReportMarker[];
      if (!markers.length || (markers.length === 1 && markers[0]?.name === "Report")) {
        throw new Error(result?.summary ?? "No structured body values were detected. Try a clearer, straight photo.");
      }
      setValues((current) => {
        const remaining = [...current];
        const detected = markers.map((marker) => {
          const key = normalizedBodyMetric(marker.name);
          const index = remaining.findIndex((item) => normalizedBodyMetric(item.name) === key);
          const match = index >= 0 ? remaining.splice(index, 1)[0] : null;
          const split = splitValue(marker.value);
          return {
            id: match?.id ?? newValue(marker.name).id,
            name: marker.name,
            value: split.value,
            unit: split.unit || match?.unit || "",
            referenceRange: marker.range && !/not detected/i.test(marker.range) ? marker.range : match?.referenceRange || "",
            status: marker.status,
          };
        });
        return [...detected, ...remaining];
      });
      setAiConfidence(Number(result.aiConfidence) || 0);
      setSummary(result.summary ?? "");
      setTitle(result.title || title);
      setMessage(`${markers.length} values extracted. Review highlighted fields before saving.`);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Body scan analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function saveScan(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError("");
    try {
      const file = fileRef.current?.files?.[0] ?? null;
      const sourceFile = storedFile ?? (file ? await storeFile(file) : null);
      if (sourceFile) setStoredFile(sourceFile);
      const response = await fetch("/api/body-composition", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_scan",
          age: client.age,
          gender: client.gender,
          clientName: client.name,
          clientPhone: client.phone,
          reportDate,
          title,
          summary,
          entrySource: mode,
          aiConfidence,
          fileId: sourceFile?.fileId,
          fileName: sourceFile?.fileName,
          fileMimeType: sourceFile?.fileMimeType,
          fileSizeBytes: sourceFile?.fileSizeBytes,
          values,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Body scan could not be saved.");
      setMessage(result?.duplicateWarning ?? "Body scan saved to verification inbox.");
      window.setTimeout(() => router.push("/body-composition/imports"), 550);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Body scan could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  const entered = values.filter((item) => item.name.trim() && item.value.trim()).length;
  const flagged = values.filter((item) => item.value.trim() && item.status !== "Normal").length;

  return (
    <BodyCompositionShell>
      <form onSubmit={saveScan}>
        <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0b806b]">Scan studio</p><h1 className="mt-1 text-[24px] font-black">Add body composition</h1><p className="mt-1 text-[11px] font-semibold text-[#697875]">Upload an InBody report or enter values manually, then save for verification.</p></div>
          <button disabled={isSaving || isAnalyzing} className="h-10 rounded-md bg-[#075b4e] px-4 text-[11px] font-black text-white disabled:opacity-50">{isSaving ? "Saving..." : "Save for verification"}</button>
        </header>
        {message ? <p className="mt-3 rounded-md bg-[#eaf9f2] p-3 text-[11px] font-bold text-[#087766]">{message}</p> : null}
        {error ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-[11px] font-bold text-[#ba563d]">{error}</p> : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-md border border-[#dbe6e3] bg-white p-3">
              <h2 className="text-[13px] font-black">Client & scan</h2>
              <div className="mt-3 space-y-2">
                <select value={selectedClientId} onChange={(event) => selectClient(event.target.value)} className="clinical-field"><option value="">New client</option>{data?.clients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone}</option>)}</select>
                <input required value={client.name} onChange={(event) => setClient((current) => ({ ...current, name: event.target.value }))} className="clinical-field" placeholder="Client name" />
                <CountryPhoneInput required value={client.phone} onChange={(phone) => setClient((current) => ({ ...current, phone }))} placeholder="Mobile number" size="sm" inputClassName="clinical-field" selectClassName="clinical-field" />
                <div className="grid grid-cols-2 gap-2"><input type="number" min="1" value={client.age} onChange={(event) => setClient((current) => ({ ...current, age: event.target.value }))} className="clinical-field" placeholder="Age" /><select value={client.gender} onChange={(event) => setClient((current) => ({ ...current, gender: event.target.value }))} className="clinical-field"><option value="">Gender</option><option>Male</option><option>Female</option><option>Other</option></select></div>
                <input type="date" required value={reportDate} onChange={(event) => setReportDate(event.target.value)} className="clinical-field" />
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="clinical-field" placeholder="Report title" />
              </div>
            </section>

            <section className="rounded-md border border-[#dbe6e3] bg-white p-3">
              <div className="grid grid-cols-2 rounded-md bg-[#eef4f2] p-1">{(["manual", "photo"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`h-8 rounded text-[10px] font-black ${mode === item ? "bg-white text-[#075b4e] shadow-sm" : "text-[#74837f]"}`}>{item === "manual" ? "Manual" : "Photo / PDF"}</button>)}</div>
              {mode === "photo" ? <div className="mt-3"><input ref={fileRef} type="file" accept=".pdf,image/*" onChange={(event) => { setFileName(event.target.files?.[0]?.name ?? ""); setStoredFile(null); }} className="w-full rounded-md border border-dashed border-[#9fc9bd] bg-[#f4fbf8] p-2 text-[10px] font-bold" /><p className="mt-2 truncate text-[9px] font-semibold text-[#74837f]">{fileName || "Clear InBody, Tanita, Omron, smart-scale image or PDF"}</p><button type="button" disabled={isAnalyzing || !fileName} onClick={() => void analyzePhoto()} className="mt-3 h-9 w-full rounded-md bg-[#102f35] text-[10px] font-black text-white disabled:opacity-50">{isAnalyzing ? "Reading values..." : "Scan & fill values"}</button>{aiConfidence ? <p className="mt-2 text-[9px] font-black text-[#0b806b]">AI confidence {aiConfidence}% · manual review required</p> : null}</div> : <p className="mt-3 text-[10px] font-semibold leading-4 text-[#74837f]">Use the standard InBody fields. Empty parameters are ignored when saving.</p>}
            </section>

            <section className="rounded-md bg-[#102f35] p-4 text-white"><div className="flex justify-between"><div><p className="text-[9px] font-black uppercase text-[#74e7c8]">Entered</p><p className="mt-1 text-[24px] font-black">{entered}</p></div><div className="text-right"><p className="text-[9px] font-black uppercase text-[#74e7c8]">Review</p><p className="mt-1 text-[24px] font-black">{flagged}</p></div></div><p className="mt-3 text-[9px] font-semibold text-white/55">Only verified scans sync to the matching patient mobile app.</p></section>
          </aside>

          <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
            <div className="flex items-center justify-between border-b border-[#e7efed] px-4 py-3"><div><h2 className="text-[14px] font-black">Composition values</h2><p className="mt-1 text-[10px] font-semibold text-[#74837f]">Weight, fat, muscle, water, metabolic and segmental values</p></div><div className="flex gap-2"><button type="button" onClick={calculateBmi} className="h-8 rounded-md border border-[#b8d4cc] px-3 text-[9px] font-black text-[#075b4e]">Calculate BMI</button><button type="button" onClick={() => setValues((current) => [...current, newValue()])} className="h-8 rounded-md border border-[#b8d4cc] px-3 text-[9px] font-black text-[#075b4e]">+ Parameter</button></div></div>
            <div className="hidden grid-cols-[1.5fr_90px_80px_120px_90px_24px] gap-2 border-b border-[#e7efed] bg-[#f8fbfa] px-3 py-2 text-[9px] font-black uppercase text-[#74837f] md:grid"><span>Parameter</span><span>Value</span><span>Unit</span><span>Reference</span><span>Status</span><span /></div>
            <div className="max-h-[650px] divide-y divide-[#e7efed] overflow-y-auto">
              {values.map((item) => <div key={item.id} className="grid gap-2 p-3 sm:grid-cols-2 md:grid-cols-[1.5fr_90px_80px_120px_90px_24px] md:items-center"><input value={item.name} onChange={(event) => updateValue(item.id, { name: event.target.value })} className="clinical-field clinical-cell" placeholder="Parameter" /><input value={item.value} onChange={(event) => updateValue(item.id, { value: event.target.value })} className="clinical-field clinical-cell" placeholder="Value" /><input value={item.unit} onChange={(event) => updateValue(item.id, { unit: event.target.value })} className="clinical-field clinical-cell" placeholder="Unit" /><input value={item.referenceRange} onChange={(event) => updateValue(item.id, { referenceRange: event.target.value })} className="clinical-field clinical-cell" placeholder="Reference" /><select value={item.status} onChange={(event) => updateValue(item.id, { status: event.target.value as ReportMarker["status"] })} className={`clinical-field clinical-cell ${item.status === "Normal" ? "bg-[#eaf9f2] text-[#087766]" : item.status === "Watch" ? "bg-[#fff7d8] text-[#8a6500]" : "bg-[#fff0ec] text-[#ba563d]"}`}><option>Normal</option><option>High</option><option>Low</option><option>Watch</option></select><button type="button" onClick={() => setValues((current) => current.filter((value) => value.id !== item.id))} className="text-[16px] font-black text-[#ba563d]">×</button></div>)}
            </div>
            <div className="border-t border-[#e7efed] bg-[#f8fbfa] p-3"><textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="min-h-[82px] w-full rounded-md border border-[#dbe6e3] bg-white p-3 text-[11px] font-semibold" placeholder="Scan summary or review note" /></div>
          </section>
        </div>
      </form>
    </BodyCompositionShell>
  );
}

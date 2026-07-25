"use client";

import { useEffect, useState } from "react";
import { BodyCompositionShell } from "@/components/body-composition-shell";
import type { BodyValueDraft } from "@/lib/body-composition";
import type { LabReport, ReportMarker } from "@/lib/vault-types";
import { useBodyData } from "../_components/use-body-data";

export default function BodyCompositionImportsPage() {
  const { data, error: loadError, isLoading, reload, token } = useBodyData("?status=draft");
  const [selected, setSelected] = useState<LabReport | null>(null);
  const [values, setValues] = useState<BodyValueDraft[]>([]);
  const [summary, setSummary] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (selected && data?.reports.some((report) => report.id === selected.id)) return;
    setSelected(data?.reports[0] ?? null);
  }, [data?.reports, selected]);

  useEffect(() => {
    if (!selected) {
      setValues([]);
      setSummary("");
      return;
    }
    setValues(selected.values.map((value) => ({ ...value, id: value.id })));
    setSummary(selected.summary);
  }, [selected]);

  async function runAction(action: "update_draft" | "verify_publish") {
    if (!selected || !token) return;
    setBusy(action);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/body-composition", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, reportId: selected.id, values, summary }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Review action failed.");
      setMessage(result?.message ?? "Review updated.");
      if (action === "verify_publish") setSelected(null);
      await reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Review action failed.");
    } finally {
      setBusy("");
    }
  }

  function updateValue(id: string, patch: Partial<BodyValueDraft>) {
    setValues((current) => current.map((value) => value.id === id ? { ...value, ...patch } : value));
  }

  return (
    <BodyCompositionShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0b806b]">Quality control</p><h1 className="mt-1 text-[24px] font-black">Review inbox</h1><p className="mt-1 text-[11px] font-semibold text-[#697875]">Correct extracted values and publish only after professional verification.</p></div><button type="button" onClick={() => void reload()} className="h-9 rounded-md border border-[#bdd4ce] bg-white px-4 text-[10px] font-black text-[#075b4e]">Refresh</button></header>
      {message ? <p className="mt-3 rounded-md bg-[#eaf9f2] p-3 text-[11px] font-bold text-[#087766]">{message}</p> : null}
      {error || loadError ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-[11px] font-bold text-[#ba563d]">{error || loadError}</p> : null}
      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e7efed] p-3"><h2 className="text-[13px] font-black">Pending scans</h2><p className="mt-1 text-[9px] font-semibold text-[#74837f]">{data?.reports.length ?? 0} awaiting verification</p></div>
          <div className="max-h-[680px] divide-y divide-[#e7efed] overflow-y-auto">{data?.reports.length ? data.reports.map((report) => <button key={report.id} type="button" onClick={() => setSelected(report)} className={`block w-full p-3 text-left ${selected?.id === report.id ? "bg-[#eaf9f2]" : "hover:bg-[#f8fbfa]"}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] font-black">{report.clientName}</p><span className="rounded bg-[#fff7d8] px-2 py-1 text-[8px] font-black text-[#8a6500]">{report.entrySource || "manual"}</span></div><p className="mt-1 text-[9px] font-semibold text-[#74837f]">{report.reportDate} · {report.parameters} values · {report.abnormal} flagged</p>{report.aiConfidence ? <p className="mt-1 text-[8px] font-bold text-[#0b806b]">AI confidence {report.aiConfidence}%</p> : null}</button>) : <p className="p-5 text-center text-[10px] font-semibold text-[#74837f]">{isLoading ? "Loading..." : "No scans waiting for review."}</p>}</div>
        </aside>

        <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
          {selected ? <>
            <div className="flex flex-col gap-3 border-b border-[#e7efed] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-[15px] font-black">{selected.clientName}</h2><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{selected.clientPhone} · {selected.reportDate} · {selected.fileName || "Manual scan"}</p></div><div className="flex gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => void runAction("update_draft")} className="h-9 rounded-md border border-[#bdd4ce] px-3 text-[10px] font-black text-[#075b4e] disabled:opacity-50">{busy === "update_draft" ? "Saving..." : "Save corrections"}</button><button type="button" disabled={Boolean(busy)} onClick={() => void runAction("verify_publish")} className="h-9 rounded-md bg-[#075b4e] px-3 text-[10px] font-black text-white disabled:opacity-50">{busy === "verify_publish" ? "Publishing..." : "Verify & publish"}</button></div></div>
            <div className="hidden grid-cols-[1.4fr_90px_80px_120px_90px] gap-2 border-b border-[#e7efed] bg-[#f8fbfa] px-3 py-2 text-[9px] font-black uppercase text-[#74837f] md:grid"><span>Parameter</span><span>Value</span><span>Unit</span><span>Reference</span><span>Status</span></div>
            <div className="max-h-[580px] divide-y divide-[#e7efed] overflow-y-auto">{values.map((value) => <div key={value.id} className="grid gap-2 p-3 sm:grid-cols-2 md:grid-cols-[1.4fr_90px_80px_120px_90px]"><input value={value.name} onChange={(event) => updateValue(value.id, { name: event.target.value })} className="clinical-field clinical-cell" /><input value={value.value} onChange={(event) => updateValue(value.id, { value: event.target.value })} className="clinical-field clinical-cell" /><input value={value.unit} onChange={(event) => updateValue(value.id, { unit: event.target.value })} className="clinical-field clinical-cell" /><input value={value.referenceRange} onChange={(event) => updateValue(value.id, { referenceRange: event.target.value })} className="clinical-field clinical-cell" /><select value={value.status} onChange={(event) => updateValue(value.id, { status: event.target.value as ReportMarker["status"] })} className={`clinical-field clinical-cell ${value.status === "Normal" ? "bg-[#eaf9f2] text-[#087766]" : value.status === "Watch" ? "bg-[#fff7d8] text-[#8a6500]" : "bg-[#fff0ec] text-[#ba563d]"}`}><option>Normal</option><option>High</option><option>Low</option><option>Watch</option></select></div>)}</div>
            <div className="border-t border-[#e7efed] bg-[#f8fbfa] p-3"><textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="min-h-[80px] w-full rounded-md border border-[#dbe6e3] bg-white p-3 text-[11px] font-semibold" /></div>
          </> : <div className="grid min-h-[420px] place-items-center p-6 text-center"><div><p className="text-[13px] font-black">Select a pending scan</p><p className="mt-1 text-[10px] text-[#74837f]">Values and source details will appear here for review.</p></div></div>}
        </section>
      </div>
    </BodyCompositionShell>
  );
}

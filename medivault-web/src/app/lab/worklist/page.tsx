"use client";

import JsBarcode from "jsbarcode";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";

type DraftReport = {
  id: string;
  labReportId: string;
  title: string;
  parameters: number;
  abnormal: number;
  workflowStatus?: "entered" | "technician_reviewed" | "pathologist_verified";
};

type WorklistItem = {
  id: string;
  accessionNumber: string;
  patientName: string;
  patientPhone: string;
  testName: string;
  sampleType: string;
  priority: string;
  stage: string;
  report: DraftReport | null;
  events: Array<{ id?: string; eventType?: string; createdAt?: string; note?: string }>;
};

type WorklistPayload = {
  role: string;
  items: WorklistItem[];
};

function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    JsBarcode(ref.current, value, {
      background: "#ffffff",
      displayValue: true,
      font: "monospace",
      fontOptions: "bold",
      fontSize: 13,
      height: 42,
      margin: 4,
      width: 1.5,
    });
  }, [value]);
  return <svg ref={ref} id={`barcode-${value}`} className="h-[64px] max-w-full" aria-label={`Barcode ${value}`} />;
}

function workflowLabel(report: DraftReport | null) {
  if (!report) return "Results pending";
  if (report.workflowStatus === "pathologist_verified") return "Verified";
  if (report.workflowStatus === "technician_reviewed") return "Technician reviewed";
  return "Results entered";
}

function workflowTone(report: DraftReport | null) {
  if (report?.workflowStatus === "pathologist_verified") return "bg-[#eaf9f2] text-[#087766]";
  if (report?.workflowStatus === "technician_reviewed") return "bg-[#eef5ff] text-[#4167a8]";
  return "bg-[#fff7d8] text-[#8a6500]";
}

export default function LabWorklistPage() {
  const { session } = useAuth();
  const [data, setData] = useState<WorklistPayload | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadWorklist = useCallback(async () => {
    if (!session?.access_token) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/lab/worklist", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Verification worklist could not be loaded.");
      setData(result as WorklistPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Verification worklist could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void loadWorklist();
  }, [loadWorklist]);

  async function workflowAction(action: string, reportId: string) {
    if (!session?.access_token) return;
    setBusyId(reportId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/lab/worklist", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, reportId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Workflow action failed.");
      if (result?.worklist) setData(result.worklist as WorklistPayload);
      setMessage(result?.message ?? "Workflow updated.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Workflow action failed.");
    } finally {
      setBusyId("");
    }
  }

  async function printBarcode(item: WorklistItem) {
    const svg = document.getElementById(`barcode-${item.accessionNumber}`);
    if (!svg) return;
    const popup = window.open("", "_blank", "width=520,height=420");
    if (!popup) {
      setError("Allow pop-ups to print the barcode label.");
      return;
    }
    popup.document.write(`<!doctype html><html><head><title>${item.accessionNumber}</title><style>body{font-family:Arial,sans-serif;margin:0;padding:24px}.label{width:360px;border:1px solid #111;padding:14px}.lab{font-size:12px;font-weight:800}.patient{font-size:15px;font-weight:800;margin-top:8px}.meta{font-size:11px;margin-top:4px;color:#333}svg{width:100%;height:82px;margin-top:8px}@media print{body{padding:0}.label{border:0}}</style></head><body><div class="label"><div class="lab">MediVault Lab · Specimen label</div><div class="patient">${item.patientName.replace(/[<>&]/g, "")}</div><div class="meta">${item.testName.replace(/[<>&]/g, "")} · ${item.sampleType.replace(/[<>&]/g, "")} · ${item.priority.toUpperCase()}</div>${svg.outerHTML}</div><script>window.onload=()=>{window.print();window.close()}</script></body></html>`);
    popup.document.close();

    if (session?.access_token) {
      void fetch("/api/lab/operations", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "barcode_printed", orderId: item.id }),
      });
    }
  }

  const pendingItems = data?.items.filter((item) => item.stage !== "reported") ?? [];
  const enteredCount = pendingItems.filter((item) => item.report?.workflowStatus === "entered").length;
  const reviewedCount = pendingItems.filter((item) => item.report?.workflowStatus === "technician_reviewed").length;
  const verifiedCount = pendingItems.filter((item) => item.report?.workflowStatus === "pathologist_verified").length;

  return (
    <LabShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#087766]">Controlled reporting</p>
          <h1 className="mt-1 text-[24px] font-black text-[#17222b]">Sample & verification worklist</h1>
          <p className="mt-1 text-[11px] font-semibold text-[#65716f]">Barcode labels, sample evidence, technician review, pathologist verification and final patient publish.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void loadWorklist()} className="h-9 rounded-md border border-[#b8d4cc] bg-white px-4 text-[11px] font-black text-[#0d5c46]">Refresh</button>
          <Link href="/lab" className="inline-flex h-9 items-center rounded-md bg-[#0d5c46] px-4 text-[11px] font-black text-white">Live queue</Link>
        </div>
      </header>

      {message ? <p className="mt-3 rounded-md bg-[#eaf9f2] p-3 text-[11px] font-bold text-[#087766]">{message}</p> : null}
      {error ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-[11px] font-bold text-[#ba563d]">{error}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Pending orders", pendingItems.length, "Collection to report"],
          ["Technician review", enteredCount, "Results entered"],
          ["Pathologist review", reviewedCount, "Technician approved"],
          ["Ready to publish", verifiedCount, `Signed in as ${data?.role?.replace("_", " ") || "--"}`],
        ].map(([label, value, note]) => (
          <div key={String(label)} className="rounded-md border border-[#dbe6e3] bg-white p-4">
            <p className="text-[9px] font-black uppercase text-[#74837f]">{label}</p>
            <p className="mt-2 text-[26px] font-black text-[#17222b]">{isLoading ? "--" : value}</p>
            <p className="mt-1 text-[10px] font-bold text-[#087766]">{note}</p>
          </div>
        ))}
      </div>

      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
        <div className="hidden grid-cols-[180px_1fr_115px_140px_170px] gap-3 border-b border-[#e7efed] bg-[#f8fbfa] px-4 py-2 text-[9px] font-black uppercase text-[#74837f] lg:grid">
          <span>Barcode / accession</span><span>Patient & sample</span><span>Sample stage</span><span>Workflow</span><span>Action</span>
        </div>
        <div className="divide-y divide-[#e7efed]">
          {pendingItems.length ? pendingItems.map((item) => (
            <article key={item.id} className="grid gap-3 p-4 lg:grid-cols-[180px_1fr_115px_140px_170px] lg:items-center">
              <div className="min-w-0">
                <Barcode value={item.accessionNumber} />
                <button type="button" onClick={() => void printBarcode(item)} className="mt-1 h-7 rounded border border-[#b8d4cc] px-2 text-[9px] font-black text-[#0d5c46]">Print label</button>
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-black text-[#17222b]">{item.patientName}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#74837f]">{item.patientPhone} · {item.testName}</p>
                <p className="mt-1 text-[9px] font-bold text-[#52605d]">{item.sampleType} · {item.priority} · {item.events.length} tracked events</p>
                {item.events[0]?.note ? <p className="mt-1 truncate text-[9px] text-[#879590]">Latest: {item.events[0].note}</p> : null}
              </div>
              <span className="w-fit rounded bg-[#eef5ff] px-2 py-1 text-[9px] font-black text-[#4167a8]">{item.stage.replace(/_/g, " ")}</span>
              <span className={`w-fit rounded px-2 py-1 text-[9px] font-black ${workflowTone(item.report)}`}>{workflowLabel(item.report)}</span>
              <div>
                {!item.report ? (
                  item.stage === "ready_for_verification"
                    ? <Link href={`/lab/create?phone=${encodeURIComponent(item.patientPhone)}&accession=${encodeURIComponent(item.accessionNumber)}`} className="inline-flex h-8 items-center rounded-md bg-[#0d5c46] px-3 text-[10px] font-black text-white">Enter results</Link>
                    : <Link href="/lab#live-queue" className="inline-flex h-8 items-center rounded-md border border-[#b8d4cc] px-3 text-[10px] font-black text-[#0d5c46]">Track sample</Link>
                ) : item.report.workflowStatus === "entered" ? (
                  <button type="button" disabled={busyId === item.report.id} onClick={() => void workflowAction("technician_review", item.report!.id)} className="h-8 rounded-md bg-[#4167a8] px-3 text-[10px] font-black text-white disabled:opacity-50">Technician review</button>
                ) : item.report.workflowStatus === "technician_reviewed" ? (
                  <button type="button" disabled={busyId === item.report.id} onClick={() => void workflowAction("pathologist_verify", item.report!.id)} className="h-8 rounded-md bg-[#8a6500] px-3 text-[10px] font-black text-white disabled:opacity-50">Verify report</button>
                ) : (
                  <button type="button" disabled={busyId === item.report.id} onClick={() => void workflowAction("publish_verified", item.report!.id)} className="h-8 rounded-md bg-[#0d5c46] px-3 text-[10px] font-black text-white disabled:opacity-50">Publish patient app</button>
                )}
                {item.report ? <p className="mt-1 text-[8px] font-bold text-[#879590]">{item.report.parameters} values · {item.report.abnormal} flagged</p> : null}
              </div>
            </article>
          )) : (
            <div className="grid min-h-[260px] place-items-center p-6 text-center">
              <div><p className="text-[13px] font-black text-[#33413e]">{isLoading ? "Loading worklist..." : "Worklist is clear"}</p><p className="mt-1 text-[10px] font-semibold text-[#85938f]">New orders and draft reports will appear here.</p></div>
            </div>
          )}
        </div>
      </section>
    </LabShell>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CountryPhoneInput } from "@/components/country-phone-input";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/mobile-shell";

type OrderStage = "ordered" | "sample_collected" | "sample_received" | "in_analysis" | "ready_for_verification" | "reported";

type OperationsPayload = {
  activity: Array<{ action?: string; createdAt?: string; note?: string }>;
  criticalAlerts: Array<{
    acknowledgedAt: string | null;
    clientName: string;
    clientPhone: string;
    markerName: string;
    range: string;
    reportDate: string;
    reportId: string;
    reportTitle: string;
    status: "High" | "Low";
    unit: string;
    value: string;
  }>;
  delivery: Array<{ clientName: string; reportDate: string; reportId: string; reportTitle: string; state: "visible_in_patient_app" | "waiting_for_patient_match" }>;
  featureAvailability: { analyzer: boolean; billing: boolean; qc: boolean };
  metrics: {
    averageTatMinutes: number | null;
    criticalUnacknowledged: number;
    delayedOrders: number;
    pendingVerification: number;
    reportsToday: number;
    samplesPending: number;
  };
  orders: Array<{
    accessionNumber: string;
    createdAt: string;
    delayed: boolean;
    elapsedMinutes: number;
    id: string;
    patientName: string;
    patientPhone: string;
    paymentStatus?: string;
    priority: "routine" | "urgent";
    sampleType: string;
    source?: string;
    stage: OrderStage;
    testName: string;
  }>;
};

const emptyMetrics: OperationsPayload["metrics"] = {
  averageTatMinutes: null,
  criticalUnacknowledged: 0,
  delayedOrders: 0,
  pendingVerification: 0,
  reportsToday: 0,
  samplesPending: 0,
};

const emptyOrder = { patientName: "", patientPhone: "", priority: "routine", sampleType: "Blood", testName: "CBC" };

const stageLabels: Record<OrderStage, string> = {
  ordered: "Ordered",
  sample_collected: "Collected",
  sample_received: "Received",
  in_analysis: "In analysis",
  ready_for_verification: "Verification",
  reported: "Reported",
};

const nextAction: Record<OrderStage, string> = {
  ordered: "Collect sample",
  sample_collected: "Receive sample",
  sample_received: "Start analysis",
  in_analysis: "Send to verify",
  ready_for_verification: "Enter results",
  reported: "Complete",
};

function formatTat(minutes: number | null) {
  if (minutes === null) return "Not enough data";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatTime(value?: string) {
  if (!value) return "--";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(parsed));
}

function stageTone(stage: OrderStage, delayed: boolean) {
  if (delayed) return "bg-[#fff0ec] text-[#b8443b]";
  if (stage === "reported") return "bg-[#eaf9f2] text-[#087766]";
  if (stage === "ready_for_verification") return "bg-[#fff8dc] text-[#8a6500]";
  return "bg-[#eef5ff] text-[#4167a8]";
}

export default function LabDashboardPage() {
  const { isConfigured, session, status } = useAuth();
  const [data, setData] = useState<OperationsPayload | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrder);

  const loadOperations = useCallback(async () => {
    if (status === "loading") return;
    if (!isConfigured || !session?.access_token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/lab/operations", { cache: "no-store", headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Operations could not be loaded.");
      setData(result as OperationsPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Operations could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, session?.access_token, status]);

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  async function runAction(payload: Record<string, string>) {
    if (!session?.access_token) return null;
    setBusyId(payload.orderId || `${payload.reportId}:${payload.markerName}` || payload.action);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/lab/operations", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Operation could not be completed.");
      if (result?.operations) setData(result.operations as OperationsPayload);
      return result;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Operation could not be completed.");
      return null;
    } finally {
      setBusyId("");
    }
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await runAction({ action: "create_order", ...orderForm });
    if (!result) return;
    setOrderForm(emptyOrder);
    setShowOrderForm(false);
    setMessage(`Order ${result.order.accessionNumber} created.`);
  }

  async function advanceOrder(orderId: string) {
    const result = await runAction({ action: "advance_order", orderId });
    if (result) setMessage(`Order moved to ${stageLabels[result.nextStage as OrderStage]}.`);
  }

  async function acknowledge(reportId: string, markerName: string) {
    const result = await runAction({ action: "acknowledge_critical", markerName, reportId });
    if (result) setMessage(`${markerName} acknowledged and added to audit trail.`);
  }

  const metrics = data?.metrics ?? emptyMetrics;
  const kpis = useMemo(() => [
    { label: "Reports today", value: metrics.reportsToday, note: "Published results", href: "/lab/reports" },
    { label: "Samples pending", value: metrics.samplesPending, note: metrics.delayedOrders ? `${metrics.delayedOrders} delayed` : "Within queue", href: "#live-queue" },
    { label: "Verification", value: metrics.pendingVerification, note: "Awaiting pathologist", href: "#live-queue" },
    { label: "Critical pending", value: metrics.criticalUnacknowledged, note: "Needs acknowledgement", href: "#critical-alerts" },
    { label: "Average TAT", value: formatTat(metrics.averageTatMinutes), note: "Collection to publish", href: "#tat" },
  ], [metrics]);

  return (
    <LabShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#087766]">Live laboratory operations</p><h1 className="mt-1 text-[26px] font-black text-[#17222b]">Command dashboard</h1><p className="mt-1 text-[12px] font-semibold text-[#65716f]">Orders, samples, verification, critical values and patient delivery.</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setShowOrderForm((current) => !current)} className="h-10 rounded-md border border-[#b8d4cc] bg-white px-4 text-[12px] font-black text-[#0d5c46]">{showOrderForm ? "Close" : "+ New order"}</button><Link href="/lab/create" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0d5c46] px-4 text-[12px] font-black text-white"><Icon name="upload" className="h-4 w-4" />Create report</Link></div>
      </header>

      {showOrderForm ? (
        <form onSubmit={createOrder} className="mt-4 grid gap-2 rounded-md border border-[#b8d4cc] bg-[#f4fbf8] p-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.05fr_1fr_0.7fr_0.65fr_auto] xl:items-end">
          <label>
            <span className="mb-1 block text-[10px] font-black text-[#61716d]">PATIENT NAME</span>
            <input required value={orderForm.patientName} onChange={(event) => setOrderForm((current) => ({ ...current, patientName: event.target.value }))} className="clinical-field" placeholder="Patient name" />
          </label>
          <CountryPhoneInput
            label="MOBILE"
            required
            value={orderForm.patientPhone}
            onChange={(patientPhone) => setOrderForm((current) => ({ ...current, patientPhone }))}
            placeholder="Mobile number"
            size="sm"
            inputClassName="clinical-field"
            selectClassName="clinical-field"
          />
          <label>
            <span className="mb-1 block text-[10px] font-black text-[#61716d]">TEST / PANEL</span>
            <input required value={orderForm.testName} onChange={(event) => setOrderForm((current) => ({ ...current, testName: event.target.value }))} className="clinical-field" placeholder="CBC" />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-black text-[#61716d]">SAMPLE</span>
            <select value={orderForm.sampleType} onChange={(event) => setOrderForm((current) => ({ ...current, sampleType: event.target.value }))} className="clinical-field">
              <option>Blood</option>
              <option>Serum</option>
              <option>Plasma</option>
              <option>Urine</option>
              <option>Swab</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-black text-[#61716d]">PRIORITY</span>
            <select value={orderForm.priority} onChange={(event) => setOrderForm((current) => ({ ...current, priority: event.target.value }))} className="clinical-field">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <button disabled={busyId === "create_order"} className="h-9 rounded-md bg-[#0d5c46] px-4 text-[11px] font-black text-white disabled:opacity-60">{busyId === "create_order" ? "Creating..." : "Create order"}</button>
        </form>
      ) : null}

      {error ? <div className="mt-4 flex items-center justify-between rounded-md border border-[#ffd6ca] bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]"><span>{error}</span><button type="button" onClick={loadOperations} className="rounded border border-current px-3 py-1.5">Retry</button></div> : null}
      {message ? <div className="mt-4 rounded-md border border-[#bfe9df] bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</div> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{kpis.map((item) => <a key={item.label} href={item.href} className="rounded-md border border-[#dbe6e3] bg-white p-4 hover:border-[#8fcbbb]"><p className="text-[10px] font-black uppercase text-[#74837f]">{item.label}</p><p className="mt-2 text-[27px] font-black text-[#17222b]">{isLoading ? "--" : item.value}</p><p className={`mt-1 text-[10px] font-bold ${item.label === "Critical pending" && Number(item.value) ? "text-[#ba563d]" : "text-[#087766]"}`}>{item.note}</p></a>)}</div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <section id="live-queue" className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e7efed] p-4"><div><h2 className="text-[15px] font-black text-[#17222b]">Live order & sample queue</h2><p className="mt-1 text-[11px] font-semibold text-[#74837f]">Persistent accession workflow and two-hour delay flag</p></div><span className="rounded bg-[#eaf9f2] px-2 py-1 text-[9px] font-black text-[#087766]">LIVE</span></div>
          <div className="hidden grid-cols-[115px_1fr_110px_120px_100px_130px] gap-3 border-b border-[#e7efed] bg-[#f8fbfa] px-4 py-2 text-[9px] font-black uppercase text-[#74837f] md:grid"><span>Accession</span><span>Patient / test</span><span>Sample</span><span>Stage</span><span>Elapsed</span><span>Action</span></div>
          <div className="divide-y divide-[#e7efed]">
            {data?.orders.length ? data.orders.map((order) => (
              <div key={order.id} className="grid gap-3 px-4 py-3 md:grid-cols-[115px_1fr_110px_120px_100px_130px] md:items-center">
                <span className="font-mono text-[11px] font-black text-[#17222b]">{order.accessionNumber}</span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-black text-[#17222b]">{order.patientName}</p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-[#74837f]">{order.testName} · {order.priority}</p>
                  {order.source === "online_booking" ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded bg-[#e0f5ef] px-1.5 py-0.5 text-[8px] font-black text-[#0d5c46]">ONLINE</span>
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-black ${order.paymentStatus === "paid" ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#fff7d8] text-[#8a6500]"}`}>{order.paymentStatus === "paid" ? "PAID" : "PAYMENT DUE"}</span>
                    </div>
                  ) : null}
                </div>
                <span className="text-[11px] font-bold text-[#52605d]">{order.sampleType}</span>
                <span className={`w-fit rounded px-2 py-1 text-[9px] font-black ${stageTone(order.stage, order.delayed)}`}>{order.delayed ? "DELAYED · " : ""}{stageLabels[order.stage]}</span>
                <span className={`text-[11px] font-bold ${order.delayed ? "text-[#ba563d]" : "text-[#52605d]"}`}>{order.elapsedMinutes} min</span>
                <div>{order.stage === "ready_for_verification" ? <Link href={`/lab/create?phone=${encodeURIComponent(order.patientPhone)}&accession=${encodeURIComponent(order.accessionNumber)}`} className="inline-flex h-8 items-center rounded-md bg-[#0d5c46] px-3 text-[10px] font-black text-white">Enter results</Link> : order.stage !== "reported" ? <button type="button" disabled={busyId === order.id} onClick={() => advanceOrder(order.id)} className="h-8 rounded-md border border-[#b8d4cc] px-3 text-[10px] font-black text-[#0d5c46] disabled:opacity-60">{busyId === order.id ? "Updating..." : nextAction[order.stage]}</button> : <span className="text-[10px] font-black text-[#087766]">Complete</span>}</div>
              </div>
            )) : <div className="p-6 text-center"><p className="text-[13px] font-black text-[#17222b]">No active orders yet</p><p className="mt-1 text-[11px] text-[#74837f]">Create a real order to demonstrate sample tracking.</p></div>}
          </div>
        </section>

        <aside id="tat" className="space-y-4">
          <section className="rounded-md bg-[#0d5c46] p-4 text-white"><p className="text-[9px] font-black uppercase text-[#99f6e4]">Publish turnaround</p><p className="mt-2 text-[30px] font-black">{isLoading ? "--" : formatTat(metrics.averageTatMinutes)}</p><p className="mt-1 text-[11px] text-white/65">Measured from sample collection to report publish.</p></section>
          <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><h3 className="text-[13px] font-black text-[#17222b]">System readiness</h3><div className="mt-3 space-y-2">{[["Analyzer / ASTM", data?.featureAvailability.analyzer], ["Quality control", data?.featureAvailability.qc], ["Billing", data?.featureAvailability.billing]].map(([label, ready]) => <div key={String(label)} className="flex items-center justify-between border-b border-[#edf3f1] py-2 last:border-0"><span className="text-[11px] font-bold text-[#52605d]">{label}</span><span className={`rounded px-2 py-1 text-[9px] font-black ${ready ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#f1f4f3] text-[#74837f]"}`}>{ready ? "Configured" : "Not configured"}</span></div>)}</div></section>
        </aside>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <section id="critical-alerts" className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white"><div className="border-b border-[#e7efed] p-4"><h2 className="text-[15px] font-black text-[#17222b]">Critical-value acknowledgement</h2><p className="mt-1 text-[11px] font-semibold text-[#74837f]">High/Low structured values with traceable acknowledgement</p></div><div className="divide-y divide-[#e7efed]">{data?.criticalAlerts.length ? data.criticalAlerts.map((alert) => <div key={`${alert.reportId}-${alert.markerName}`} className="grid gap-3 p-4 sm:grid-cols-[1fr_0.55fr_0.7fr] sm:items-center"><div><p className="text-[12px] font-black text-[#17222b]">{alert.markerName} · {alert.status}</p><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{alert.clientName} · {alert.clientPhone}</p></div><div><p className="text-[13px] font-black text-[#ba563d]">{alert.value} {alert.unit}</p><p className="mt-1 text-[9px] font-semibold text-[#879590]">Range {alert.range || "not provided"}</p></div><div className="sm:text-right">{alert.acknowledgedAt ? <><span className="rounded bg-[#eaf9f2] px-2 py-1 text-[9px] font-black text-[#087766]">ACKNOWLEDGED</span><p className="mt-1 text-[9px] text-[#74837f]">{formatTime(alert.acknowledgedAt)}</p></> : <button type="button" disabled={busyId === `${alert.reportId}:${alert.markerName}`} onClick={() => acknowledge(alert.reportId, alert.markerName)} className="h-8 rounded-md bg-[#ba563d] px-3 text-[10px] font-black text-white disabled:opacity-60">Acknowledge</button>}</div></div>) : <div className="p-5 text-[11px] font-bold text-[#74837f]">No High/Low results found.</div>}</div></section>

        <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white"><div className="border-b border-[#e7efed] p-4"><h2 className="text-[15px] font-black text-[#17222b]">Patient delivery</h2><p className="mt-1 text-[11px] font-semibold text-[#74837f]">Live phone-match delivery state</p></div><div className="divide-y divide-[#e7efed]">{data?.delivery.length ? data.delivery.slice(0, 6).map((item) => <Link key={item.reportId} href={`/lab/reports?reportId=${encodeURIComponent(item.reportId)}`} className="flex items-center justify-between gap-3 p-4 hover:bg-[#f8fbfa]"><div className="min-w-0"><p className="truncate text-[11px] font-black text-[#17222b]">{item.reportTitle}</p><p className="mt-1 text-[10px] text-[#74837f]">{item.clientName} · {item.reportDate}</p></div><span className={`shrink-0 rounded px-2 py-1 text-[9px] font-black ${item.state === "visible_in_patient_app" ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#fff8dc] text-[#8a6500]"}`}>{item.state === "visible_in_patient_app" ? "VISIBLE" : "WAITING MATCH"}</span></Link>) : <div className="p-5 text-[11px] font-bold text-[#74837f]">No published reports yet.</div>}</div></section>
      </div>

      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white"><div className="flex items-center justify-between border-b border-[#e7efed] p-4"><div><h2 className="text-[15px] font-black text-[#17222b]">Operational audit trail</h2><p className="mt-1 text-[11px] font-semibold text-[#74837f]">Order and critical-value actions</p></div><button type="button" onClick={loadOperations} disabled={isLoading} className="rounded-md border border-[#cfded9] px-3 py-2 text-[10px] font-black text-[#0d5c46]">Refresh</button></div><div className="divide-y divide-[#e7efed]">{data?.activity.length ? data.activity.map((item, index) => <div key={`${item.createdAt}-${index}`} className="grid gap-2 px-4 py-3 sm:grid-cols-[160px_140px_1fr]"><span className="text-[10px] font-semibold text-[#74837f]">{formatTime(item.createdAt)}</span><span className="text-[10px] font-black uppercase text-[#0d5c46]">{item.action?.replace(/_/g, " ")}</span><span className="text-[11px] text-[#52605d]">{item.note}</span></div>) : <div className="p-5 text-[11px] font-bold text-[#74837f]">No operational activity yet.</div>}</div></section>
    </LabShell>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/mobile-shell";
import type { LabProfile } from "@/lib/vault-types";

type AdminRole = "lab_admin" | "lab_staff" | "pathologist" | "technician" | "collector" | "cashier";

type AdminPayload = {
  generatedAt: string;
  lab: LabProfile;
  metrics: {
    averageTatMinutes: number | null;
    criticalAcknowledgements: number;
    flaggedToday: number;
    invoices: number;
    publishedToday: number;
    publishedTotal: number;
    qcRuns: number;
    reportsToday: number;
    totalClients: number;
    totalStaff: number;
  };
  operations: {
    auditEvents: number;
    diagnosticReports: number;
    failedJobs: number;
    observations: number;
    queuedJobs: number;
    runningJobs: number;
    specimens: number;
  };
  roleCounts: Record<AdminRole, number>;
  workspace: { lastActivityAt: string | null; status: "active" };
};

const roleRows: Array<{ role: AdminRole; label: string; scope: string }> = [
  { role: "lab_admin", label: "Admin", scope: "Settings, billing, users and audit" },
  { role: "pathologist", label: "Pathologist", scope: "Verify, publish and correct reports" },
  { role: "technician", label: "Technician", scope: "Result entry, analyzer review and QC" },
  { role: "collector", label: "Collector", scope: "Sample collection and tracking" },
  { role: "cashier", label: "Cashier", scope: "Invoices, payments and refunds" },
  { role: "lab_staff", label: "Lab staff", scope: "Orders, samples and result entry" },
];

function toneClass(tone: string) {
  if (tone === "red") return "bg-[#fff0ec] text-[#ba563d]";
  if (tone === "amber") return "bg-[#fff8dc] text-[#8a6500]";
  if (tone === "green") return "bg-[#eaf9f2] text-[#087766]";
  return "bg-[#102323] text-white";
}

function formatTime(value: string | null) {
  if (!value) return "No report activity yet";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatTat(minutes: number | null) {
  if (minutes === null) return "Not enough data";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function AdminPage() {
  const { isConfigured, session, status } = useAuth();
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (status === "loading") return;
    if (!isConfigured) {
      setData(null);
      setError("MongoDB is not configured for this environment.");
      setIsLoading(false);
      return;
    }
    if (!session?.access_token) {
      setData(null);
      setError("Sign in is required to load admin operations.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/dashboard", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Admin data could not be loaded.");
      setData(result as AdminPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Admin data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, session?.access_token, status]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const kpis = useMemo(() => [
    { label: "Lab workspace", value: data ? "1" : "--", note: data ? `${data.metrics.totalStaff} staff assigned` : isLoading ? "Loading" : "Unavailable", tone: "green" },
    { label: "Reports today", value: data ? data.metrics.reportsToday.toLocaleString("en-IN") : "--", note: data ? `${data.metrics.publishedToday} published` : isLoading ? "Loading" : "Unavailable", tone: "dark" },
    { label: "Flagged today", value: data ? data.metrics.flaggedToday.toLocaleString("en-IN") : "--", note: data ? `${data.metrics.criticalAcknowledgements} acknowledged` : isLoading ? "Loading" : "Unavailable", tone: data?.metrics.flaggedToday ? "red" : "green" },
    { label: "Total clients", value: data ? data.metrics.totalClients.toLocaleString("en-IN") : "--", note: data ? `${data.metrics.publishedTotal} reports published` : isLoading ? "Loading" : "Unavailable", tone: "amber" },
  ], [data, isLoading]);

  return (
    <LabShell>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#087766]">Live operations</p>
            <span className="h-1.5 w-1.5 rounded-full bg-[#22a06b]" />
          </div>
          <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Admin operations</h1>
          <p className="mt-1 text-[13px] font-semibold text-[#65716f]">Authorized workspace data from reports, clients, staff, FHIR and audit collections.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadDashboard} disabled={isLoading} className="h-10 rounded-md border border-[#cfe0dc] bg-white px-4 text-[12px] font-black text-[#0d5c46] disabled:opacity-60">
            {isLoading ? "Refreshing..." : "Refresh data"}
          </button>
          <Link href="/lab" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#dce9e5] bg-white px-4 text-[12px] font-bold text-[#102323]"><Icon name="analytics" className="h-4 w-4" />Lab view</Link>
          <Link href="/dashboard" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0d5c46] px-4 text-[12px] font-bold text-white"><Icon name="home" className="h-4 w-4" />Patient app</Link>
        </div>
      </div>

      {error ? <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-[#ffd6ca] bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]"><span>{error}</span><button type="button" onClick={loadDashboard} className="rounded border border-current px-3 py-1.5">Retry</button></div> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <section key={item.label} className="rounded-md border border-[#dbe6e3] bg-white p-4">
            <div className="flex items-start justify-between gap-3"><p className="text-[11px] font-bold text-[#6f7f7c]">{item.label}</p><span className={`rounded px-2 py-1 text-[9px] font-black ${toneClass(item.tone)}`}>{item.note}</span></div>
            <p className="mt-3 text-[30px] font-black text-[#102323]">{item.value}</p>
          </section>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e7efed] p-4"><div><h2 className="text-[15px] font-black text-[#102323]">Workspace performance</h2><p className="mt-1 text-[11px] font-bold text-[#6f7f7c]">Only labs assigned to your account are included</p></div><span className="rounded bg-[#eaf9f2] px-2 py-1 text-[10px] font-black text-[#087766]">LIVE DATABASE</span></div>
          {data ? (
            <div className="grid gap-4 p-4 md:grid-cols-[1.4fr_repeat(3,0.7fr)] md:items-center">
              <div><p className="text-[14px] font-black text-[#162523]">{data.lab.name}</p><p className="mt-1 text-[11px] font-bold text-[#7b8986]">{data.lab.address || "Address not configured"}</p><p className="mt-1 text-[10px] font-semibold text-[#8a9794]">Last activity: {formatTime(data.workspace.lastActivityAt)}</p></div>
              <div><p className="text-[10px] font-bold text-[#8a9794]">REPORTS TODAY</p><p className="mt-1 text-[18px] font-black">{data.metrics.reportsToday}</p></div>
              <div><p className="text-[10px] font-bold text-[#8a9794]">PUBLISHED</p><p className="mt-1 text-[18px] font-black">{data.metrics.publishedToday}</p></div>
              <div><p className="text-[10px] font-bold text-[#8a9794]">AVG. PUBLISH TAT</p><p className="mt-1 text-[14px] font-black">{formatTat(data.metrics.averageTatMinutes)}</p></div>
            </div>
          ) : <div className="p-5 text-[12px] font-bold text-[#7b8986]">{isLoading ? "Loading workspace data..." : "No workspace data available."}</div>}
        </section>

        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e7efed] p-4"><h2 className="text-[15px] font-black text-[#102323]">Assigned roles</h2><p className="mt-1 text-[11px] font-bold text-[#6f7f7c]">Live staff membership counts</p></div>
          <div className="divide-y divide-[#e7efed]">
            {roleRows.map((item) => <div key={item.role} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-[12px] font-black text-[#162523]">{item.label}</p><p className="mt-0.5 text-[10px] text-[#65716f]">{item.scope}</p></div><span className="grid h-7 min-w-7 place-items-center rounded bg-[#eff8f5] px-2 text-[11px] font-black text-[#0d5c46]">{data?.roleCounts[item.role] ?? "--"}</span></div>)}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#087766]">FHIR data layer</p><p className="mt-2 text-[24px] font-black">{data?.operations.diagnosticReports ?? "--"}</p><p className="mt-1 text-[11px] font-bold text-[#65716f]">Diagnostic reports · {data?.operations.observations ?? "--"} observations · {data?.operations.specimens ?? "--"} specimens</p></section>
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#087766]">Background queues</p><p className="mt-2 text-[24px] font-black">{data ? data.operations.queuedJobs + data.operations.runningJobs : "--"}</p><p className="mt-1 text-[11px] font-bold text-[#65716f]">Active jobs · {data?.operations.failedJobs ?? "--"} failed</p></section>
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#087766]">Operational records</p><p className="mt-2 text-[24px] font-black">{data?.operations.auditEvents ?? "--"}</p><p className="mt-1 text-[11px] font-bold text-[#65716f]">Audit events · {data?.metrics.qcRuns ?? "--"} QC runs · {data?.metrics.invoices ?? "--"} invoices</p></section>
      </div>

      <p className="mt-4 text-right text-[10px] font-semibold text-[#7b8986]">{data ? `Last refreshed ${formatTime(data.generatedAt)}` : "Waiting for live data"}</p>
    </LabShell>
  );
}

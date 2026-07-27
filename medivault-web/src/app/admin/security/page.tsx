"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, AdminStatCard, StatusPill } from "@/app/admin/_components/admin-ui";

type AuditLog = {
  action: string;
  actor: string;
  createdAt: string;
  entityId?: string;
  entityType?: string;
  id: string;
  note?: string;
};

type SecurityPayload = {
  generatedAt: string;
  logs: AuditLog[];
  metrics: {
    activeSessions: number;
    auditEvents: number;
    suspendedUsers: number;
    totalUsers: number;
  };
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function readableAction(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function actionTone(action: string) {
  if (action.includes("suspend") || action.includes("delete") || action.includes("failed")) return "critical" as const;
  if (action.includes("password") || action.includes("session")) return "warning" as const;
  if (action.includes("publish") || action.includes("created") || action.includes("verified")) return "green" as const;
  return "neutral" as const;
}

export default function AdminSecurityPage() {
  const { session, status } = useAuth();
  const [data, setData] = useState<SecurityPayload | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadSecurity = useCallback(async () => {
    if (status === "loading" || !session?.access_token) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/security", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Security activity could not be loaded.");
      setData(result as SecurityPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Security activity could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => { loadSecurity(); }, [loadSecurity]);

  const logs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.logs ?? []).filter((log) => !needle || `${log.action} ${log.actor} ${log.entityType} ${log.entityId}`.toLowerCase().includes(needle));
  }, [data?.logs, query]);

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Security operations"
        title="Audit & sessions"
        description="Review privileged actions, report activity, account changes and live session exposure across MediVault."
        actions={<button type="button" onClick={loadSecurity} disabled={isLoading} className="h-10 rounded-md border border-[#cdded9] bg-white px-4 text-[11px] font-black text-[#31504a] disabled:opacity-55">{isLoading ? "Refreshing..." : "Refresh security"}</button>}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Audit events" value={data?.metrics.auditEvents ?? "--"} note="Recent security and clinical actions" />
        <AdminStatCard label="Active sessions" value={data?.metrics.activeSessions ?? "--"} note="Currently valid login sessions" tone="dark" />
        <AdminStatCard label="Total users" value={data?.metrics.totalUsers ?? "--"} note="Patient and dashboard accounts" tone="green" />
        <AdminStatCard label="Suspended users" value={data?.metrics.suspendedUsers ?? "--"} note="Authentication blocked" tone={data?.metrics.suspendedUsers ? "critical" : "neutral"} />
      </div>

      {error ? <AdminError message={error} onRetry={loadSecurity} /> : null}

      <section className="mt-4 rounded-md border border-[#dbe6e3] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e8efed] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-[14px] font-black">Operational audit trail</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Latest user, report, access and system actions</p></div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter action, actor or entity" className="h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[11px] font-bold outline-none focus:border-[#0b8c78] sm:w-72" />
        </div>
        {isLoading && !data ? <AdminSkeleton rows={7} /> : logs.length ? (
          <div className="divide-y divide-[#edf2f1]">
            {logs.map((log) => (
              <div key={`${log.id}-${log.createdAt}`} className="grid gap-2 p-4 sm:grid-cols-[170px_minmax(0,1fr)_150px_170px] sm:items-center">
                <StatusPill tone={actionTone(log.action)}>{readableAction(log.action)}</StatusPill>
                <div className="min-w-0"><p className="truncate text-[11px] font-black text-[#17302b]">{log.actor}</p><p className="mt-1 truncate text-[10px] font-semibold text-[#71817d]">{log.note || log.entityId || "Workspace event"}</p></div>
                <p className="text-[10px] font-bold capitalize text-[#53645f]">{log.entityType?.replace(/_/g, " ") || "system"}</p>
                <time className="text-[10px] font-semibold text-[#71817d]">{formatDate(log.createdAt)}</time>
              </div>
            ))}
          </div>
        ) : <AdminEmpty title="No matching audit events" description="Security and operational actions will appear here as the system is used." />}
      </section>
    </AdminShell>
  );
}

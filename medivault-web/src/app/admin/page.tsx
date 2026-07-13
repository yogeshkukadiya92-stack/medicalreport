"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import type { AdminDashboardPayload, AdminTask } from "@/lib/admin-types";
import { readNutritionAdminClients } from "@/lib/nutrition-admin";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, AdminStatCard, StatusPill } from "@/app/admin/_components/admin-ui";

function formatDate(value?: string) {
  if (!value) return "No activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

function taskTone(task: AdminTask) {
  if (task.priority === "urgent" || task.priority === "high") return "critical" as const;
  if (task.priority === "medium") return "warning" as const;
  return "neutral" as const;
}

export default function AdminPage() {
  const { session, status } = useAuth();
  const [data, setData] = useState<AdminDashboardPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [nutrition, setNutrition] = useState({ bodyScans: 0, clients: 0, followUps: 0, plans: 0 });

  const loadDashboard = useCallback(async () => {
    if (status === "loading") return;
    if (!session?.access_token) {
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
      if (!response.ok) throw new Error(result?.error ?? "Admin workspace could not be loaded.");
      setData(result as AdminDashboardPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Admin workspace could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => {
    const clients = readNutritionAdminClients();
    const today = new Date().toISOString().slice(0, 10);
    setNutrition({
      bodyScans: clients.reduce((sum, client) => sum + (client.bodyEntries?.length ?? 0), 0),
      clients: clients.length,
      followUps: clients.filter((client) => client.status === "Follow-up" || Boolean(client.followUpDate && client.followUpDate <= today)).length,
      plans: clients.reduce((sum, client) => sum + (client.dietPlans?.length ?? 0), 0),
    });
  }, []);

  const maxTrend = Math.max(1, ...(data?.trend.map((item) => item.reports) ?? [1]));

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Live command center"
        title="Admin overview"
        description="One operational view for clients, linked patient accounts, reports, critical attention, follow-ups and system readiness."
        actions={(
          <>
            <button type="button" onClick={loadDashboard} disabled={isLoading} className="h-10 rounded-md border border-[#cdded9] bg-white px-4 text-[11px] font-black text-[#31504a] disabled:opacity-55">
              {isLoading ? "Refreshing..." : "Refresh live data"}
            </button>
            <Link href="/admin/clients" className="inline-flex h-10 items-center rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white">Open client CRM</Link>
          </>
        )}
      />

      {error ? <AdminError message={error} onRetry={loadDashboard} /> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminStatCard href="/admin/clients" label="Total clients" value={data?.metrics.totalClients ?? "--"} note={`${data?.metrics.patientAppLinked ?? 0} linked to patient app`} tone="green" />
        <AdminStatCard href="/admin/reports" label="Reports today" value={data?.metrics.reportsToday ?? "--"} note={`${data?.metrics.publishedTotal ?? 0} published total`} />
        <AdminStatCard href="/admin/reports?risk=flagged" label="Flagged today" value={data?.metrics.flaggedToday ?? "--"} note="Reports needing review" tone={data?.metrics.flaggedToday ? "critical" : "neutral"} />
        <AdminStatCard href="/admin/tasks" label="Critical pending" value={data?.metrics.criticalPending ?? "--"} note="Unacknowledged values" tone={data?.metrics.criticalPending ? "critical" : "green"} />
        <AdminStatCard href="/admin/tasks" label="Open tasks" value={data?.metrics.openTasks ?? "--"} note={`${data?.metrics.overdueTasks ?? 0} manual tasks overdue`} tone="warning" />
        <AdminStatCard href="/admin/reports?sync=unclaimed" label="Waiting link" value={data?.metrics.unclaimedReports ?? "--"} note="Reports not claimed in app" tone="dark" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="flex items-start justify-between gap-3 border-b border-[#e8efed] p-4">
            <div><h2 className="text-[14px] font-black">7-day report activity</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Published workflow volume and abnormal report load</p></div>
            <StatusPill tone="green">LIVE DATABASE</StatusPill>
          </div>
          {data ? (
            <div className="p-4">
              <div className="grid h-52 grid-cols-7 items-end gap-2 border-b border-[#dfe9e6] sm:gap-4">
                {data.trend.map((item) => (
                  <div key={item.date} className="flex h-full min-w-0 flex-col justify-end gap-1">
                    <div className="flex min-h-0 flex-1 items-end justify-center gap-1">
                      <div className="w-[44%] max-w-7 rounded-t bg-[#0f8f7c]" style={{ height: `${Math.max(item.reports ? 8 : 2, (item.reports / maxTrend) * 100)}%` }} title={`${item.reports} reports`} />
                      <div className="w-[28%] max-w-4 rounded-t bg-[#e27a5e]" style={{ height: `${Math.max(item.abnormal ? 8 : 2, (item.abnormal / maxTrend) * 100)}%` }} title={`${item.abnormal} abnormal`} />
                    </div>
                    <p className="truncate pb-2 text-center text-[8px] font-bold text-[#75837f] sm:text-[9px]">{shortDate(item.date)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-[9px] font-bold text-[#64736f]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#0f8f7c]" />Reports</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[#e27a5e]" />Abnormal</span></div>
            </div>
          ) : isLoading ? <AdminSkeleton rows={3} /> : <AdminEmpty title="No report activity yet" description="Live seven-day activity will appear after the first report is created in this workspace." />}
        </section>

        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="flex items-start justify-between gap-3 border-b border-[#e8efed] p-4">
            <div><h2 className="text-[14px] font-black">Attention queue</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">System alerts and assigned work</p></div>
            <Link href="/admin/tasks" className="text-[10px] font-black text-[#087766]">View all</Link>
          </div>
          {isLoading && !data ? <AdminSkeleton rows={4} /> : data?.tasks.length ? (
            <div className="divide-y divide-[#edf2f1]">
              {data.tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3.5">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${task.priority === "urgent" ? "bg-[#d65c42]" : task.priority === "high" ? "bg-[#e69b28]" : "bg-[#18a28d]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-black text-[#17302b]">{task.title}</p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-[#72817d]">{task.clientName || "Workspace"} · Due {formatDate(task.dueDate)}</p>
                  </div>
                  <StatusPill tone={taskTone(task)}>{task.priority}</StatusPill>
                </div>
              ))}
            </div>
          ) : <AdminEmpty title="Queue is clear" description="New critical alerts, delayed orders and manual follow-ups will appear here." />}
        </section>
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="min-w-0 rounded-md border border-[#dbe6e3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e8efed] p-4"><div><h2 className="text-[14px] font-black">Recently active clients</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Report, app-link and task status in one row</p></div><Link href="/admin/clients" className="text-[10px] font-black text-[#087766]">All clients</Link></div>
          {data?.recentClients.length ? (
            <div className="divide-y divide-[#edf2f1]">
              {data.recentClients.map((client) => (
                <Link key={client.id} href={`/admin/clients/${encodeURIComponent(client.id)}`} className="grid gap-2 p-4 hover:bg-[#f7fbfa] sm:grid-cols-[minmax(0,1fr)_90px_110px_110px] sm:items-center">
                  <div className="min-w-0"><p className="truncate text-[12px] font-black">{client.name}</p><p className="mt-1 text-[10px] font-semibold text-[#71817d]">{client.phone} · Last report {formatDate(client.latestReportDate)}</p></div>
                  <p className="text-[10px] font-bold text-[#53645f]">{client.reportCount} reports</p>
                  <StatusPill tone={client.abnormalReports ? "critical" : "green"}>{client.abnormalReports ? `${client.abnormalReports} flagged` : "No flags"}</StatusPill>
                  <StatusPill tone={client.appLinked ? "green" : "warning"}>{client.appLinked ? "App linked" : "Not linked"}</StatusPill>
                </Link>
              ))}
            </div>
          ) : isLoading ? <AdminSkeleton rows={4} /> : <AdminEmpty title="No clients yet" description="Create a lab client or report and the live client overview will appear here." action={<Link href="/lab/clients" className="text-[11px] font-black text-[#087766]">Add first client</Link>} />}
        </section>

        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e8efed] p-4"><div><h2 className="text-[14px] font-black">Latest reports</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Publication, risk and delivery state</p></div><Link href="/admin/reports" className="text-[10px] font-black text-[#087766]">Control center</Link></div>
          {data?.recentReports.length ? (
            <div className="divide-y divide-[#edf2f1]">
              {data.recentReports.slice(0, 6).map((report) => (
                <Link key={report.id} href={`/admin/reports?reportId=${encodeURIComponent(report.id)}`} className="grid gap-2 p-4 hover:bg-[#f7fbfa] sm:grid-cols-[minmax(0,1fr)_100px_90px] sm:items-center">
                  <div className="min-w-0"><p className="truncate text-[11px] font-black">{report.title}</p><p className="mt-1 truncate text-[10px] font-semibold text-[#71817d]">{report.clientName} · {formatDate(report.reportDate)}</p></div>
                  <StatusPill tone={report.abnormal ? "critical" : "green"}>{report.abnormal ? `${report.abnormal} flagged` : "Normal"}</StatusPill>
                  <StatusPill tone={report.deliveryState === "claimed" ? "green" : "warning"}>{report.deliveryState === "claimed" ? "In app" : "Waiting"}</StatusPill>
                </Link>
              ))}
            </div>
          ) : isLoading ? <AdminSkeleton rows={4} /> : <AdminEmpty title="No reports yet" description="Published lab reports will appear here automatically." />}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#087766]">Nutrition CRM</p><p className="mt-2 text-[24px] font-black">{nutrition.clients}</p><p className="mt-1 text-[10px] font-semibold text-[#71817d]">{nutrition.plans} plans · {nutrition.bodyScans} body scans · {nutrition.followUps} follow-ups</p><Link href="/nutrition" className="mt-3 inline-block text-[10px] font-black text-[#087766]">Open nutrition workspace</Link></section>
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#087766]">FHIR normalization</p><p className="mt-2 text-[24px] font-black">{data?.operations.normalizedReports ?? "--"}</p><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Normalized diagnostic records available</p></section>
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#087766]">Background jobs</p><p className="mt-2 text-[24px] font-black">{data?.operations.queuedJobs ?? "--"}</p><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Queued or running · {data?.operations.failedJobs ?? 0} failed</p></section>
        <section className="rounded-md border border-[#dbe6e3] bg-white p-4"><p className="text-[10px] font-black uppercase text-[#087766]">Audit coverage</p><p className="mt-2 text-[24px] font-black">{data?.operations.auditEvents ?? "--"}</p><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Traceable lab and platform actions</p></section>
      </div>

      <p className="mt-4 text-right text-[9px] font-semibold text-[#7b8986]">{data ? `Live data refreshed ${formatDate(data.generatedAt)}` : "Waiting for live data"}</p>
    </AdminShell>
  );
}

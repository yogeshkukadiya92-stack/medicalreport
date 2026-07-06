"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/mobile-shell";
import type { LabProfile, LabReport } from "@/lib/vault-types";

type LabKpis = {
  abnormalReports: number;
  pendingUnmatchedReports: number;
  publishedReports: number;
  todayReports: number;
  totalClients: number;
};

type WorkQueue = {
  abnormalToday: number;
  missingAttachment: number;
  publishedToday: number;
  todayReports: number;
  unmatched: number;
};

type CriticalAlert = {
  clientName: string;
  clientPhone: string;
  markerName: string;
  range: string;
  reportDate: string;
  reportId: string;
  reportTitle: string;
  reportType: string;
  status: "High" | "Low";
  unit: string;
  value: string;
};

type SyncStatus = {
  claimedReports: number;
  claimPercentage: number;
  publishedTotal: number;
  unclaimedReports: number;
};

type Activity = {
  action: string;
  createdAt: string;
  note: string;
};

const emptyKpis: LabKpis = {
  abnormalReports: 0,
  pendingUnmatchedReports: 0,
  publishedReports: 0,
  todayReports: 0,
  totalClients: 0,
};
const emptyWorkQueue: WorkQueue = {
  abnormalToday: 0,
  missingAttachment: 0,
  publishedToday: 0,
  todayReports: 0,
  unmatched: 0,
};
const emptySyncStatus: SyncStatus = {
  claimedReports: 0,
  claimPercentage: 0,
  publishedTotal: 0,
  unclaimedReports: 0,
};

function formatDate(value: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(value));
}

function alertClass(status: string) {
  return status === "High" ? "bg-[#fff0ec] text-[#ba563d]" : "bg-[#eef5ff] text-[#4167a8]";
}

export default function LabDashboardPage() {
  const { session } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [kpis, setKpis] = useState<LabKpis>(emptyKpis);
  const [workQueue, setWorkQueue] = useState<WorkQueue>(emptyWorkQueue);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(emptySyncStatus);
  const [lab, setLab] = useState<LabProfile | null>(null);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.access_token) return;

    let isCancelled = false;
    async function loadDashboard() {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/lab/reports", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (isCancelled) return;
      if (!response.ok) {
        setError(result?.error ?? "Lab dashboard could not be loaded.");
      } else {
        setCriticalAlerts(result?.criticalAlerts ?? []);
        setKpis(result?.kpis ?? emptyKpis);
        setLab(result?.lab ?? null);
        setReports(result?.reports ?? []);
        setActivity(result?.recentActivity ?? []);
        setSyncStatus(result?.syncStatus ?? emptySyncStatus);
        setWorkQueue(result?.workQueue ?? emptyWorkQueue);
      }
      setIsLoading(false);
    }

    loadDashboard();
    return () => {
      isCancelled = true;
    };
  }, [session?.access_token]);

  const recentReports = useMemo(() => reports.slice(0, 5), [reports]);

  return (
    <LabShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#087766]">{lab?.name ?? "MediVault Lab"}</p>
          <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Lab dashboard</h1>
        </div>
        <Link href="/lab/create" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0a7d6e] px-4 text-[13px] font-bold text-white">
          <Icon name="upload" className="h-4 w-4" />
          Create report
        </Link>
      </div>

      {error ? <div className="mt-5 rounded-lg border border-[#ffd6ca] bg-[#fff0ec] p-4 text-[13px] font-bold text-[#ba563d]">{error}</div> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Today reports", kpis.todayReports],
          ["Total clients", kpis.totalClients],
          ["Pending unmatched", kpis.pendingUnmatchedReports],
          ["Published", kpis.publishedReports],
          ["Abnormal", kpis.abnormalReports],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#e2ebe8] bg-white p-4">
            <p className="text-[12px] font-bold text-[#6f7f7c]">{label}</p>
            <p className="mt-3 text-[32px] font-black text-[#102323]">{isLoading ? "--" : value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1.15fr_0.85fr]">
        <section className="rounded-lg border border-[#e2ebe8] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf3f1] p-4">
            <div>
              <h2 className="text-[16px] font-black text-[#102323]">Today work queue</h2>
              <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{formatDate(today)} operations</p>
            </div>
            <Link href="/lab/create" className="rounded-md bg-[#0a7d6e] px-3 py-2 text-[12px] font-bold text-white">
              New
            </Link>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {[
              { action: "Open", href: `/lab/reports?from=${today}&to=${today}`, label: "Reports today", value: workQueue.todayReports },
              { action: "Review", href: `/lab/reports?from=${today}&to=${today}`, label: "Abnormal today", value: workQueue.abnormalToday },
              { action: "Attach", href: "/lab/reports", label: "Needs attachment", value: workQueue.missingAttachment },
              { action: "Match", href: "/lab/reports?sync=unclaimed", label: "Waiting phone link", value: workQueue.unmatched },
              { action: "View", href: `/lab/reports?from=${today}&to=${today}&status=published`, label: "Published today", value: workQueue.publishedToday },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-[13px] font-black text-[#162523]">{item.label}</p>
                  <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{isLoading ? "--" : item.value} item{item.value === 1 ? "" : "s"}</p>
                </div>
                <Link href={item.href} className="rounded-md border border-[#dce9e5] px-3 py-2 text-[12px] font-bold text-[#087766]">
                  {item.action}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[#e2ebe8] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf3f1] p-4">
            <div>
              <h2 className="text-[16px] font-black text-[#102323]">Critical alerts</h2>
              <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">Latest High/Low structured values</p>
            </div>
            <Link href="/lab/reports" className="text-[12px] font-bold text-[#087766]">
              History
            </Link>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {criticalAlerts.length ? (
              criticalAlerts.map((alert) => (
                <Link key={`${alert.reportId}-${alert.markerName}-${alert.status}`} href="/lab/reports" className="grid gap-3 p-4 hover:bg-[#f7fbfa] md:grid-cols-[1fr_0.75fr_0.65fr] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-[#162523]">{alert.markerName}</p>
                    <p className="mt-1 truncate text-[12px] font-bold text-[#6f7f7c]">{alert.clientName} - {alert.clientPhone}</p>
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-[#162523]">
                      {alert.value} {alert.unit}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#8a9794]">{alert.range || "No range"}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold ${alertClass(alert.status)}`}>{alert.status}</span>
                    <p className="mt-2 text-[11px] font-bold text-[#8a9794]">{alert.reportType} - {formatDate(alert.reportDate)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-5 text-[13px] font-bold text-[#6f7f7c]">No High/Low values found.</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#e2ebe8] bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-black text-[#102323]">Client app sync</h2>
              <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">Reports visible after phone match</p>
            </div>
            <span className="rounded-md bg-[#e8f7f2] px-2 py-1 text-[11px] font-bold text-[#087766]">
              {isLoading ? "--" : `${syncStatus.claimPercentage}%`}
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#edf3f1]">
            <div className="h-full rounded-full bg-[#0a7d6e]" style={{ width: `${Math.min(100, syncStatus.claimPercentage)}%` }} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#f7fbfa] p-3">
              <p className="text-[11px] font-bold text-[#7b8986]">Visible</p>
              <p className="mt-2 text-[24px] font-black text-[#087766]">{isLoading ? "--" : syncStatus.claimedReports}</p>
            </div>
            <div className="rounded-lg bg-[#fff7d8] p-3">
              <p className="text-[11px] font-bold text-[#8a6500]">Waiting</p>
              <p className="mt-2 text-[24px] font-black text-[#8a6500]">{isLoading ? "--" : syncStatus.unclaimedReports}</p>
            </div>
            <div className="rounded-lg bg-[#f7fbfa] p-3">
              <p className="text-[11px] font-bold text-[#7b8986]">Published</p>
              <p className="mt-2 text-[24px] font-black text-[#102323]">{isLoading ? "--" : syncStatus.publishedTotal}</p>
            </div>
          </div>

          <Link href="/lab/reports?sync=unclaimed" className="mt-4 flex h-10 items-center justify-center rounded-lg border border-[#dce9e5] text-[12px] font-bold text-[#087766]">
            View waiting reports
          </Link>
        </section>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border border-[#e2ebe8] bg-white">
          <div className="flex items-center justify-between border-b border-[#edf3f1] p-4">
            <h2 className="text-[16px] font-black text-[#102323]">Recent reports</h2>
            <Link href="/lab/reports" className="text-[12px] font-bold text-[#087766]">
              View history
            </Link>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {recentReports.length ? (
              recentReports.map((report) => (
                <Link key={report.id} href="/lab/reports" className="grid gap-3 p-4 hover:bg-[#f7fbfa] md:grid-cols-[1fr_150px_120px_120px] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-[#162523]">{report.title}</p>
                    <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{report.clientName} - {report.clientPhone}</p>
                  </div>
                  <span className="text-[12px] font-bold text-[#52605d]">{report.reportType}</span>
                  <span className="text-[12px] font-bold text-[#52605d]">{formatDate(report.reportDate)}</span>
                  <span className={`w-fit rounded-md px-2 py-1 text-[11px] font-bold ${report.abnormal ? "bg-[#fff0ec] text-[#ba563d]" : "bg-[#eaf9f2] text-[#087766]"}`}>
                    {report.abnormal ? `${report.abnormal} flagged` : "Normal"}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-5 text-[13px] font-bold text-[#6f7f7c]">No lab reports yet.</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#e2ebe8] bg-white">
          <div className="border-b border-[#edf3f1] p-4">
            <h2 className="text-[16px] font-black text-[#102323]">Recent activity</h2>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {activity.length ? (
              activity.map((item) => (
                <div key={`${item.createdAt}-${item.note}`} className="p-4">
                  <p className="text-[13px] font-black capitalize text-[#162523]">{item.action}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#65716f]">{item.note}</p>
                  <p className="mt-2 text-[11px] font-bold text-[#8a9794]">{formatDate(item.createdAt)}</p>
                </div>
              ))
            ) : (
              <div className="p-5 text-[13px] font-bold text-[#6f7f7c]">No activity yet.</div>
            )}
          </div>
        </section>
      </div>
    </LabShell>
  );
}

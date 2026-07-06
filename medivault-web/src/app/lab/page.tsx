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

function formatDate(value: string) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(value));
}

export default function LabDashboardPage() {
  const { session } = useAuth();
  const [kpis, setKpis] = useState<LabKpis>(emptyKpis);
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
        setKpis(result?.kpis ?? emptyKpis);
        setLab(result?.lab ?? null);
        setReports(result?.reports ?? []);
        setActivity(result?.recentActivity ?? []);
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

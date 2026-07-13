"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import type { AdminClientDetailPayload } from "@/lib/admin-types";
import { findNutritionAdminClient, type NutritionAdminClient } from "@/lib/nutrition-admin";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, AdminStatCard, StatusPill } from "@/app/admin/_components/admin-ui";

type DetailTab = "overview" | "reports" | "activity";

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function cleanMetricName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const bodyMetricLabels: Record<string, string> = {
  bmi: "BMI",
  bodyfat: "Body fat",
  bodyfatpercentage: "Body fat",
  musclemass: "Muscle mass",
  skeletalmuscle: "Skeletal muscle",
  visceralfat: "Visceral fat",
  weight: "Weight",
};

function taskTone(priority: string) {
  if (priority === "urgent" || priority === "high") return "critical" as const;
  if (priority === "medium") return "warning" as const;
  return "neutral" as const;
}

export default function AdminClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;
  const { session, status } = useAuth();
  const [data, setData] = useState<AdminClientDetailPayload | null>(null);
  const [nutrition, setNutrition] = useState<NutritionAdminClient | null>(null);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadClient = useCallback(async () => {
    if (status === "loading" || !clientId) return;
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/clients/${encodeURIComponent(clientId)}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Client profile could not be loaded.");
      const nextData = result as AdminClientDetailPayload;
      setData(nextData);
      setNutrition(findNutritionAdminClient(nextData.client.phone));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Client profile could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, session?.access_token, status]);

  useEffect(() => { loadClient(); }, [loadClient]);

  const abnormalSignals = data?.reports.flatMap((report) => report.values
    .filter((value) => value.status !== "Normal")
    .map((value) => ({ ...value, reportDate: report.reportDate, reportId: report.id }))) ?? [];
  const bodyFromReports = new Map<string, { date: string; label: string; unit: string; value: string }>();
  data?.reports.forEach((report) => report.values.forEach((value) => {
    const key = cleanMetricName(value.name);
    const label = bodyMetricLabels[key];
    if (label && !bodyFromReports.has(label)) bodyFromReports.set(label, { date: report.reportDate, label, unit: value.unit, value: value.value });
  }));
  const latestNutritionBody = nutrition?.bodyEntries?.length
    ? [...nutrition.bodyEntries].sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")))[0]
    : null;
  const latestPlan = nutrition?.dietPlans?.length
    ? [...nutrition.dietPlans].sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")))[0]
    : null;
  const whatsappPhone = data?.client.phone.replace(/\D/g, "") || "";

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Client 360"
        title={data?.client.name || (isLoading ? "Loading client" : "Client profile")}
        description={data ? `${data.client.phone} · ${data.client.age ? `${data.client.age} years` : "Age not set"} · ${data.client.gender || "Gender not set"}` : "Loading the unified client record."}
        actions={data ? (
          <>
            <Link href="/admin/clients" className="inline-flex h-10 items-center rounded-md border border-[#d2e0dc] bg-white px-4 text-[11px] font-black text-[#435a55]">Back to clients</Link>
            <Link href={`/admin/tasks?clientId=${encodeURIComponent(data.client.id)}`} className="inline-flex h-10 items-center rounded-md border border-[#bcdad2] bg-[#eaf8f4] px-4 text-[11px] font-black text-[#087766]">Add task</Link>
            {whatsappPhone ? <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white">WhatsApp</a> : null}
          </>
        ) : null}
      />

      {error ? <AdminError message={error} onRetry={loadClient} /> : null}

      {data ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Lab reports" value={data.client.reportCount} note={`${data.client.claimedReports} visible in patient app`} tone="green" />
            <AdminStatCard label="Abnormal reports" value={data.client.abnormalReports} note={`${abnormalSignals.length} individual signals`} tone={data.client.abnormalReports ? "critical" : "neutral"} />
            <AdminStatCard label="Open tasks" value={data.client.openTasks} note="Manual care and follow-up work" tone="warning" />
            <AdminStatCard label="Patient account" value={data.client.appLinked ? "Linked" : "Pending"} note={data.account?.email || "No matching account"} tone={data.client.appLinked ? "dark" : "neutral"} />
          </div>

          <div className="mt-4 flex gap-1 overflow-x-auto rounded-md border border-[#dbe6e3] bg-white p-1" role="tablist" aria-label="Client profile sections">
            {(["overview", "reports", "activity"] as DetailTab[]).map((item) => (
              <button key={item} type="button" onClick={() => setTab(item)} className={`h-9 min-w-max rounded px-4 text-[10px] font-black capitalize ${tab === item ? "bg-[#123d36] text-white" : "text-[#60716c] hover:bg-[#f0f6f4]"}`} role="tab" aria-selected={tab === item}>{item}</button>
            ))}
          </div>

          {tab === "overview" ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <section className="rounded-md border border-[#dbe6e3] bg-white">
                <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Identity and access</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Lab profile, patient app account and consent state</p></div>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div className="rounded-md bg-[#f5f9f8] p-3"><p className="text-[9px] font-black uppercase text-[#78908a]">Lab profile</p><p className="mt-2 text-[12px] font-black">{data.client.name}</p><p className="mt-1 text-[10px] font-semibold text-[#667772]">{data.client.phone}</p><p className="mt-1 text-[10px] font-semibold text-[#667772]">Added {formatDate(data.client.createdAt)}</p></div>
                  <div className="rounded-md bg-[#f5f9f8] p-3"><p className="text-[9px] font-black uppercase text-[#78908a]">Patient account</p>{data.account ? <><p className="mt-2 truncate text-[12px] font-black">{data.account.name || data.client.name}</p><p className="mt-1 truncate text-[10px] font-semibold text-[#667772]">{data.account.email}</p><p className="mt-1 text-[10px] font-semibold text-[#667772]">{data.patientVault?.familyMembers ?? 0} profiles · {data.patientVault?.uploadedReports ?? 0} self uploads</p></> : <p className="mt-2 text-[11px] font-bold text-[#8a6500]">No account matches this mobile number.</p>}</div>
                </div>
                <div className="border-t border-[#edf2f1] p-4"><p className="text-[9px] font-black uppercase text-[#78908a]">Consent records</p><div className="mt-2 flex flex-wrap gap-2">{data.consents.length ? data.consents.map((consent, index) => <StatusPill key={`${consent.consent_type}-${index}`} tone={consent.is_granted ? "green" : "critical"}>{consent.consent_type || "Consent"}: {consent.is_granted ? "Granted" : "Revoked"}</StatusPill>) : <span className="text-[10px] font-semibold text-[#71817d]">No recorded consent preferences.</span>}</div></div>
              </section>

              <section className="rounded-md border border-[#dbe6e3] bg-white">
                <div className="flex items-center justify-between border-b border-[#e8efed] p-4"><div><h2 className="text-[14px] font-black">Health signals</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Latest abnormal lab observations</p></div><Link href="#" onClick={(event) => { event.preventDefault(); setTab("reports"); }} className="text-[10px] font-black text-[#087766]">All reports</Link></div>
                {abnormalSignals.length ? <div className="divide-y divide-[#edf2f1]">{abnormalSignals.slice(0, 7).map((signal) => <Link key={`${signal.reportId}-${signal.id}`} href={`/lab/reports?reportId=${encodeURIComponent(signal.reportId)}`} className="grid gap-2 p-3.5 hover:bg-[#f8fbfa] sm:grid-cols-[minmax(0,1fr)_120px_90px] sm:items-center"><div className="min-w-0"><p className="truncate text-[11px] font-black">{signal.name}</p><p className="mt-0.5 text-[9px] font-semibold text-[#75847f]">{formatDate(signal.reportDate)} · Range {signal.referenceRange || "not set"}</p></div><p className="text-[11px] font-black">{signal.value} {signal.unit}</p><StatusPill tone={signal.status === "Watch" ? "warning" : "critical"}>{signal.status}</StatusPill></Link>)}</div> : <AdminEmpty title="No abnormal signals" description="No High, Low or Watch values are currently recorded for this client." />}
              </section>

              <section className="rounded-md border border-[#dbe6e3] bg-white">
                <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Body composition</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Latest nutrition scan plus lab-linked body parameters</p></div>
                {latestNutritionBody || bodyFromReports.size ? (
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {latestNutritionBody ? <>
                      <div className="rounded-md bg-[#f2faf7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">Weight</p><p className="mt-1 text-[19px] font-black">{latestNutritionBody.weight || "--"} <small className="text-[10px]">kg</small></p></div>
                      <div className="rounded-md bg-[#f2faf7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">BMI</p><p className="mt-1 text-[19px] font-black">{latestNutritionBody.bmi || "--"}</p></div>
                      <div className="rounded-md bg-[#f2faf7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">Body fat</p><p className="mt-1 text-[19px] font-black">{latestNutritionBody.bodyFat || "--"} <small className="text-[10px]">%</small></p></div>
                      <div className="rounded-md bg-[#f2faf7] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">Muscle mass</p><p className="mt-1 text-[19px] font-black">{latestNutritionBody.muscleMass || "--"} <small className="text-[10px]">kg</small></p></div>
                    </> : null}
                    {[...bodyFromReports.values()].slice(0, 4).map((metric) => <div key={metric.label} className="rounded-md border border-[#e1ebe8] p-3"><p className="text-[9px] font-black uppercase text-[#71817d]">{metric.label}</p><p className="mt-1 text-[17px] font-black">{metric.value} <small className="text-[9px]">{metric.unit}</small></p><p className="mt-1 text-[8px] font-bold text-[#87938f]">Lab · {formatDate(metric.date)}</p></div>)}
                  </div>
                ) : <AdminEmpty title="No body composition yet" description="A nutrition scan or body-composition report will automatically appear here." action={<Link href="/nutrition/body-composition" className="text-[11px] font-black text-[#087766]">Add body scan</Link>} />}
              </section>

              <section className="rounded-md border border-[#dbe6e3] bg-white">
                <div className="flex items-center justify-between border-b border-[#e8efed] p-4"><div><h2 className="text-[14px] font-black">Nutrition care</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Program, latest plan and scheduled follow-up</p></div><Link href="/nutrition/diet-builder" className="text-[10px] font-black text-[#087766]">Diet builder</Link></div>
                {nutrition ? <div className="p-4"><div className="flex flex-wrap gap-2"><StatusPill tone="green">{nutrition.status || "Client"}</StatusPill><StatusPill tone="blue">{nutrition.paymentStatus || "Payment not set"}</StatusPill>{nutrition.followUpDate ? <StatusPill tone="warning">Follow-up {formatDate(nutrition.followUpDate)}</StatusPill> : null}</div><p className="mt-3 text-[13px] font-black">{nutrition.goal || "Nutrition goal not set"}</p><p className="mt-1 text-[10px] font-semibold text-[#71817d]">{nutrition.packageName || "No package selected"}</p><div className="mt-4 rounded-md bg-[#f5f9f8] p-3"><p className="text-[9px] font-black uppercase text-[#78908a]">Latest diet plan</p>{latestPlan ? <><p className="mt-2 text-[11px] font-black">{latestPlan.goal || "Personalized diet plan"}</p><p className="mt-1 text-[10px] leading-5 text-[#667772]">{latestPlan.summary || "Plan saved without summary."}</p></> : <p className="mt-2 text-[10px] font-semibold text-[#71817d]">No saved diet plan yet.</p>}</div></div> : <AdminEmpty title="Not in nutrition CRM" description="Create a nutrition client with the same mobile number to connect plans, scans and follow-ups." action={<Link href="/nutrition/clients" className="text-[11px] font-black text-[#087766]">Open nutrition clients</Link>} />}
              </section>
            </div>
          ) : null}

          {tab === "reports" ? (
            <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
              <div className="flex items-center justify-between border-b border-[#e8efed] p-4"><div><h2 className="text-[14px] font-black">Complete report timeline</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">All published lab records for this client</p></div><Link href={`/lab/create?clientId=${encodeURIComponent(data.client.id)}`} className="inline-flex h-9 items-center rounded-md bg-[#0b6f61] px-3 text-[10px] font-black text-white">Create report</Link></div>
              {data.reports.length ? <div className="divide-y divide-[#edf2f1]">{data.reports.map((report) => <div key={report.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_110px_90px_110px_170px] md:items-center"><div className="min-w-0"><p className="truncate text-[12px] font-black">{report.title}</p><p className="mt-1 truncate text-[10px] font-semibold text-[#71817d]">{report.labReportId} · {report.reportType}</p></div><p className="text-[10px] font-bold">{formatDate(report.reportDate)}</p><StatusPill tone={report.abnormal ? "critical" : "green"}>{report.abnormal ? `${report.abnormal} flagged` : "Normal"}</StatusPill><StatusPill tone={report.deliveryState === "claimed" ? "green" : "warning"}>{report.deliveryState === "claimed" ? "In app" : "Waiting link"}</StatusPill><div className="flex gap-2"><Link href={`/lab/reports?reportId=${encodeURIComponent(report.id)}`} className="inline-flex h-8 items-center rounded-md border border-[#d5e2de] px-3 text-[9px] font-black">Open</Link><Link href={`/lab/pdf?reportId=${encodeURIComponent(report.id)}`} className="inline-flex h-8 items-center rounded-md bg-[#e6f6f1] px-3 text-[9px] font-black text-[#087766]">PDF</Link></div></div>)}</div> : <AdminEmpty title="No reports" description="No lab reports are linked to this client yet." />}
            </section>
          ) : null}

          {tab === "activity" ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <section className="rounded-md border border-[#dbe6e3] bg-white"><div className="flex items-center justify-between border-b border-[#e8efed] p-4"><div><h2 className="text-[14px] font-black">Care tasks</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Manual work assigned to this client</p></div><Link href={`/admin/tasks?clientId=${encodeURIComponent(data.client.id)}`} className="text-[10px] font-black text-[#087766]">Add task</Link></div>{data.tasks.length ? <div className="divide-y divide-[#edf2f1]">{data.tasks.map((task) => <div key={task.id} className="flex items-start gap-3 p-4"><div className="min-w-0 flex-1"><p className="text-[11px] font-black">{task.title}</p><p className="mt-1 text-[9px] font-semibold text-[#71817d]">Due {formatDate(task.dueDate)} · {task.assignedTo || "Unassigned"}</p>{task.note ? <p className="mt-2 text-[10px] leading-4 text-[#596b66]">{task.note}</p> : null}</div><StatusPill tone={taskTone(task.priority)}>{task.status.replace(/_/g, " ")}</StatusPill></div>)}</div> : <AdminEmpty title="No care tasks" description="Add a follow-up, report review or payment task for this client." />}</section>
              <section className="rounded-md border border-[#dbe6e3] bg-white"><div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Order history</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Accession and sample workflow activity</p></div>{data.orders.length ? <div className="divide-y divide-[#edf2f1]">{data.orders.map((order, index) => <div key={order.id || index} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_110px_100px]"><div><p className="text-[11px] font-black">{order.testName || "Lab order"}</p><p className="mt-1 text-[9px] font-semibold text-[#71817d]">{order.accessionNumber || "No accession"} · {formatDate(order.createdAt)}</p></div><StatusPill tone={order.priority === "urgent" ? "critical" : "neutral"}>{order.priority || "routine"}</StatusPill><StatusPill tone="blue">{order.stage?.replace(/_/g, " ") || "ordered"}</StatusPill></div>)}</div> : <AdminEmpty title="No orders" description="Sample orders linked to this mobile number will appear here." />}</section>
              <section className="rounded-md border border-[#dbe6e3] bg-white xl:col-span-2"><div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Audit history</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Traceable report and administrator actions</p></div>{data.audit.length ? <div className="divide-y divide-[#edf2f1]">{data.audit.map((item, index) => <div key={item.id || `${item.createdAt}-${index}`} className="grid gap-2 p-4 sm:grid-cols-[140px_120px_minmax(0,1fr)]"><p className="text-[9px] font-bold text-[#71817d]">{formatDate(item.createdAt)}</p><StatusPill tone="neutral">{item.action}</StatusPill><p className="text-[10px] font-semibold text-[#53645f]">{item.note || "Recorded activity"}</p></div>)}</div> : <AdminEmpty title="No audit events" description="Report edits, publications and administrative actions will be recorded here." />}</section>
            </div>
          ) : null}
        </>
      ) : isLoading ? <div className="mt-5 rounded-md border border-[#dbe6e3] bg-white"><AdminSkeleton rows={7} /></div> : null}
    </AdminShell>
  );
}

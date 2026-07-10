import { NextRequest, NextResponse } from "next/server";
import { todayDate } from "@/lib/lab-dashboard";
import { getLabContext } from "@/lib/lab-server";
import type { LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

type TimedReport = Pick<LabReport, "publishedAt" | "sampleCollectedAt">;
type AdminRole = "lab_admin" | "lab_staff" | "pathologist" | "technician" | "collector" | "cashier";

function averageMinutes(reports: TimedReport[]) {
  const durations = reports.flatMap((report) => {
    if (!report.sampleCollectedAt || !report.publishedAt) return [];
    const start = new Date(report.sampleCollectedAt).getTime();
    const end = new Date(report.publishedAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
    return [(end - start) / 60_000];
  });
  if (!durations.length) return null;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const labId = context.lab.id;
  const today = todayDate();
  const roleValues: AdminRole[] = ["lab_admin", "lab_staff", "pathologist", "technician", "collector", "cashier"];

  const [
    reportsToday,
    publishedToday,
    flaggedToday,
    publishedTotal,
    totalClients,
    staffRows,
    latestReport,
    timedReports,
    diagnosticReports,
    observations,
    specimens,
    queuedJobs,
    runningJobs,
    failedJobs,
    reportAuditEvents,
    platformAuditEvents,
    qcRuns,
    invoices,
    criticalAcknowledgements,
  ] = await Promise.all([
    context.db.collection<LabReport>("labReports").countDocuments({ labId, reportDate: today }),
    context.db.collection<LabReport>("labReports").countDocuments({ labId, reportDate: today, status: "published" }),
    context.db.collection<LabReport>("labReports").countDocuments({ labId, reportDate: today, abnormal: { $gt: 0 } }),
    context.db.collection<LabReport>("labReports").countDocuments({ labId, status: "published" }),
    context.db.collection("labClients").countDocuments({ labId }),
    context.db.collection("labUsers").aggregate<{ _id: AdminRole; count: number }>([
      { $match: { labId } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]).toArray(),
    context.db.collection<LabReport>("labReports").findOne({ labId }, { projection: { _id: 0, updatedAt: 1 }, sort: { updatedAt: -1 } }),
    context.db.collection<LabReport>("labReports").find(
      { labId, reportDate: today, publishedAt: { $type: "string" }, sampleCollectedAt: { $type: "string" } },
      { projection: { _id: 0, publishedAt: 1, sampleCollectedAt: 1 } },
    ).limit(500).toArray(),
    context.db.collection("normalizedDiagnosticReports").countDocuments({ labId }),
    context.db.collection("normalizedObservations").countDocuments({ labId }),
    context.db.collection("normalizedSpecimens").countDocuments({ labId }),
    context.db.collection("backgroundJobs").countDocuments({ "payload.labId": labId, status: "queued" }),
    context.db.collection("backgroundJobs").countDocuments({ "payload.labId": labId, status: "running" }),
    context.db.collection("backgroundJobs").countDocuments({ "payload.labId": labId, status: "failed" }),
    context.db.collection("labReportAuditLogs").countDocuments({ labId }),
    context.db.collection("platformAuditLogs").countDocuments({ labId }),
    context.db.collection("qualityControlRuns").countDocuments({ labId }),
    context.db.collection("billingInvoices").countDocuments({ labId }),
    context.db.collection("criticalValueAcknowledgements").countDocuments({ labId }),
  ]);

  const roleCounts = Object.fromEntries(roleValues.map((role) => [role, 0])) as Record<AdminRole, number>;
  for (const row of staffRows) {
    if (row._id in roleCounts) roleCounts[row._id] = row.count;
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    lab: context.lab,
    metrics: {
      averageTatMinutes: averageMinutes(timedReports),
      criticalAcknowledgements,
      flaggedToday,
      invoices,
      publishedToday,
      publishedTotal,
      qcRuns,
      reportsToday,
      totalClients,
      totalStaff: staffRows.reduce((sum, row) => sum + row.count, 0),
    },
    operations: {
      auditEvents: reportAuditEvents + platformAuditEvents,
      diagnosticReports,
      failedJobs,
      observations,
      queuedJobs,
      runningJobs,
      specimens,
    },
    roleCounts,
    workspace: {
      lastActivityAt: latestReport?.updatedAt ?? null,
      status: "active",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import type { AdminDashboardPayload, AdminTask } from "@/lib/admin-types";
import { enrichAdminClients, enrichAdminReports, getAdminContext, getAdminSystemTasks } from "@/lib/admin-server";
import { todayDate } from "@/lib/lab-dashboard";
import type { LabClient, LabReport, LabRole } from "@/lib/vault-types";

export const runtime = "nodejs";

type TrendRow = { _id: string; abnormal: number; reports: number };

const labRoles: LabRole[] = ["lab_admin", "lab_staff", "pathologist", "technician", "collector", "cashier"];

function recentDateKeys(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - index - 1));
    return new Intl.DateTimeFormat("en-CA", { timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata" }).format(date);
  });
}

function priorityRank(task: AdminTask) {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[task.priority];
}

function normalizeManualTask(task: AdminTask): AdminTask {
  return { ...task, source: "manual" };
}

export async function GET(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const labId = context.lab.id;
  const today = todayDate();
  const dateKeys = recentDateKeys(7);
  const [
    reportsToday,
    flaggedToday,
    publishedTotal,
    totalClients,
    staffRows,
    recentClientDocs,
    recentReportDocs,
    manualTasks,
    openTasks,
    overdueTasks,
    linkedPhones,
    unclaimedReports,
    reportAuditEvents,
    platformAuditEvents,
    failedJobs,
    queuedJobs,
    normalizedReports,
    trendRows,
    systemTasks,
  ] = await Promise.all([
    context.db.collection<LabReport>("labReports").countDocuments({ labId, reportDate: today }),
    context.db.collection<LabReport>("labReports").countDocuments({ labId, reportDate: today, abnormal: { $gt: 0 } }),
    context.db.collection<LabReport>("labReports").countDocuments({ labId, status: "published" }),
    context.db.collection<LabClient>("labClients").countDocuments({ labId }),
    context.db.collection("labUsers").aggregate<{ _id: LabRole; count: number }>([
      { $match: { labId } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]).toArray(),
    context.db.collection<LabClient>("labClients").find(
      { labId },
      { projection: { _id: 0 } },
    ).sort({ updatedAt: -1 }).limit(6).toArray(),
    context.db.collection<LabReport>("labReports").find(
      { labId },
      { projection: { _id: 0 } },
    ).sort({ updatedAt: -1 }).limit(8).toArray(),
    context.db.collection<AdminTask>("adminTasks").find(
      { labId, status: { $ne: "completed" } },
      { projection: { _id: 0 } },
    ).sort({ dueDate: 1, updatedAt: -1 }).limit(12).toArray(),
    context.db.collection("adminTasks").countDocuments({ labId, status: { $ne: "completed" } }),
    context.db.collection("adminTasks").countDocuments({ labId, status: { $ne: "completed" }, dueDate: { $lt: today } }),
    context.db.collection("clientReportLinks").distinct("normalizedPhone", { labId, state: "claimed" }),
    context.db.collection("clientReportLinks").countDocuments({ labId, state: "unclaimed" }),
    context.db.collection("labReportAuditLogs").countDocuments({ labId }),
    context.db.collection("platformAuditLogs").countDocuments({ labId }),
    context.db.collection("backgroundJobs").countDocuments({ "payload.labId": labId, status: "failed" }),
    context.db.collection("backgroundJobs").countDocuments({ "payload.labId": labId, status: { $in: ["queued", "running"] } }),
    context.db.collection("normalizedDiagnosticReports").countDocuments({ labId }),
    context.db.collection<LabReport>("labReports").aggregate<TrendRow>([
      { $match: { labId, reportDate: { $in: dateKeys } } },
      {
        $group: {
          _id: "$reportDate",
          abnormal: { $sum: { $cond: [{ $gt: ["$abnormal", 0] }, 1, 0] } },
          reports: { $sum: 1 },
        },
      },
    ]).toArray(),
    getAdminSystemTasks(context.db, labId),
  ]);

  const [recentClients, recentReports] = await Promise.all([
    enrichAdminClients(context.db, labId, recentClientDocs),
    enrichAdminReports(context.db, labId, recentReportDocs),
  ]);
  const roleCounts = Object.fromEntries(labRoles.map((role) => [role, 0])) as Record<LabRole, number>;
  staffRows.forEach((row) => { roleCounts[row._id] = row.count; });
  const trendByDate = new Map(trendRows.map((row) => [row._id, row]));
  const tasks = [...systemTasks, ...manualTasks.map(normalizeManualTask)]
    .sort((left, right) => priorityRank(left) - priorityRank(right) || left.dueDate.localeCompare(right.dueDate))
    .slice(0, 8);

  const payload: AdminDashboardPayload = {
    generatedAt: new Date().toISOString(),
    lab: context.lab,
    metrics: {
      criticalPending: systemTasks.filter((task) => task.type === "critical").length,
      flaggedToday,
      openTasks: openTasks + systemTasks.length,
      overdueTasks,
      patientAppLinked: linkedPhones.length,
      publishedTotal,
      reportsToday,
      totalClients,
      totalStaff: staffRows.reduce((sum, row) => sum + row.count, 0),
      unclaimedReports,
    },
    operations: {
      auditEvents: reportAuditEvents + platformAuditEvents,
      failedJobs,
      normalizedReports,
      queuedJobs,
    },
    recentClients,
    recentReports,
    roleCounts,
    tasks,
    trend: dateKeys.map((date) => ({
      abnormal: trendByDate.get(date)?.abnormal ?? 0,
      date,
      reports: trendByDate.get(date)?.reports ?? 0,
    })),
  };

  return NextResponse.json(payload);
}

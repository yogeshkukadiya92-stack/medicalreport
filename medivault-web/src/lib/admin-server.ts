import type { Db } from "mongodb";
import type { NextRequest } from "next/server";
import type { AdminClientSummary, AdminReportRow, AdminTask } from "@/lib/admin-types";
import { getLabContext } from "@/lib/lab-server";
import type { LabClient, LabReport } from "@/lib/vault-types";

type AdminContext = Exclude<Awaited<ReturnType<typeof getLabContext>>, { error: string; status: number }>;

type ClientReportStat = {
  _id: string;
  abnormalReports: number;
  latestReportAt?: string;
  latestReportDate?: string;
  reportCount: number;
};

type ClientLinkStat = {
  _id: string;
  claimedReports: number;
  unclaimedReports: number;
};

type ClientTaskStat = { _id: string; openTasks: number };
type PublicAuthUser = { email?: string; id: string; phone?: string };
type ReportLink = { labReportId?: string; state?: string };
type CriticalAcknowledgement = { markerName?: string; reportId?: string };

export async function getAdminContext(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return context;

  const isOwner = context.lab.ownerUserId === context.userId;
  if (!isOwner && context.labUser.role !== "lab_admin") {
    return { error: "Lab administrator access is required for this workspace.", status: 403 as const };
  }

  await ensureAdminIndexes(context.db);
  return context;
}

export async function ensureAdminIndexes(db: Db) {
  await Promise.all([
    db.collection("adminTasks").createIndex({ labId: 1, status: 1, dueDate: 1 }),
    db.collection("adminTasks").createIndex({ labId: 1, clientId: 1, updatedAt: -1 }),
    db.collection("adminTasks").createIndex({ labId: 1, id: 1 }, { unique: true }),
    db.collection("labClients").createIndex({ labId: 1, updatedAt: -1 }),
  ]);
}

export function escapeSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeAdminPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function enrichAdminClients(db: Db, labId: string, clients: LabClient[]): Promise<AdminClientSummary[]> {
  if (!clients.length) return [];

  const clientIds = clients.map((client) => client.id);
  const phones = [...new Set(clients.map((client) => normalizeAdminPhone(client.normalizedPhone || client.phone)).filter(Boolean))];
  const [reportStats, linkStats, taskStats, authUsers] = await Promise.all([
    db.collection<LabReport>("labReports").aggregate<ClientReportStat>([
      { $match: { labId, clientId: { $in: clientIds } } },
      {
        $group: {
          _id: "$clientId",
          abnormalReports: { $sum: { $cond: [{ $gt: ["$abnormal", 0] }, 1, 0] } },
          latestReportAt: { $max: "$updatedAt" },
          latestReportDate: { $max: "$reportDate" },
          reportCount: { $sum: 1 },
        },
      },
    ]).toArray(),
    db.collection("clientReportLinks").aggregate<ClientLinkStat>([
      { $match: { labId, normalizedPhone: { $in: phones } } },
      {
        $group: {
          _id: "$normalizedPhone",
          claimedReports: { $sum: { $cond: [{ $eq: ["$state", "claimed"] }, 1, 0] } },
          unclaimedReports: { $sum: { $cond: [{ $eq: ["$state", "unclaimed"] }, 1, 0] } },
        },
      },
    ]).toArray(),
    db.collection("adminTasks").aggregate<ClientTaskStat>([
      { $match: { labId, clientId: { $in: clientIds }, status: { $ne: "completed" } } },
      { $group: { _id: "$clientId", openTasks: { $sum: 1 } } },
    ]).toArray(),
    phones.length
      ? db.collection<PublicAuthUser>("authUsers").find(
        { phone: { $in: phones } },
        { projection: { _id: 0, email: 1, id: 1, phone: 1 } },
      ).toArray()
      : Promise.resolve([]),
  ]);

  const reportByClient = new Map(reportStats.map((item) => [item._id, item]));
  const linksByPhone = new Map(linkStats.map((item) => [normalizeAdminPhone(item._id), item]));
  const tasksByClient = new Map(taskStats.map((item) => [item._id, item.openTasks]));
  const usersByPhone = new Map(authUsers.map((item) => [normalizeAdminPhone(item.phone || ""), item]));

  return clients.map((client) => {
    const phone = normalizeAdminPhone(client.normalizedPhone || client.phone);
    const reports = reportByClient.get(client.id);
    const links = linksByPhone.get(phone);
    const account = usersByPhone.get(phone);
    return {
      ...client,
      abnormalReports: reports?.abnormalReports ?? 0,
      appEmail: account?.email,
      appLinked: Boolean(account || (links?.claimedReports ?? 0) > 0),
      appUserId: account?.id,
      claimedReports: links?.claimedReports ?? 0,
      latestReportAt: reports?.latestReportAt,
      latestReportDate: reports?.latestReportDate,
      openTasks: tasksByClient.get(client.id) ?? 0,
      reportCount: reports?.reportCount ?? 0,
      unclaimedReports: links?.unclaimedReports ?? 0,
    };
  });
}

export async function enrichAdminReports(db: Db, labId: string, reports: LabReport[]): Promise<AdminReportRow[]> {
  if (!reports.length) return [];
  const reportIds = reports.map((report) => report.id);
  const links = await db.collection<ReportLink>("clientReportLinks").find(
    { labId, labReportId: { $in: reportIds } },
    { projection: { _id: 0, labReportId: 1, state: 1 } },
  ).toArray();
  const linkByReport = new Map(links.map((link) => [link.labReportId, link.state]));

  return reports.map((report) => ({
    ...report,
    criticalValues: report.values.filter((value) => value.status === "High" || value.status === "Low").length,
    deliveryState: linkByReport.get(report.id) === "claimed"
      ? "claimed"
      : linkByReport.get(report.id) === "unclaimed"
        ? "unclaimed"
        : "not_linked",
  }));
}

export async function getAdminSystemTasks(db: Db, labId: string): Promise<AdminTask[]> {
  const delayedBefore = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const [criticalReports, acknowledgements, unclaimedLinks, delayedOrders] = await Promise.all([
    db.collection<LabReport>("labReports").find(
      { labId, status: "published", values: { $elemMatch: { status: { $in: ["High", "Low"] } } } },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).limit(20).toArray(),
    db.collection<CriticalAcknowledgement>("criticalValueAcknowledgements").find(
      { labId },
      { projection: { _id: 0, markerName: 1, reportId: 1 } },
    ).toArray(),
    db.collection<ReportLink>("clientReportLinks").find(
      { labId, state: "unclaimed" },
      { projection: { _id: 0, labReportId: 1 } },
    ).sort({ updatedAt: -1 }).limit(8).toArray(),
    db.collection("labOrders").find(
      { labId, stage: { $nin: ["reported", "cancelled"] }, createdAt: { $lt: delayedBefore } },
      { projection: { _id: 0 } },
    ).sort({ createdAt: 1 }).limit(8).toArray(),
  ]);

  const acknowledged = new Set(acknowledgements.map((item) => `${item.reportId}:${item.markerName?.trim().toLowerCase()}`));
  const criticalTasks = criticalReports.flatMap((report) => report.values.flatMap((value) => {
    if (value.status !== "High" && value.status !== "Low") return [];
    if (acknowledged.has(`${report.id}:${value.name.trim().toLowerCase()}`)) return [];
    return [{
      actionHref: `/lab/reports?reportId=${encodeURIComponent(report.id)}`,
      clientId: report.clientId,
      clientName: report.clientName,
      clientPhone: report.clientPhone,
      createdAt: report.updatedAt,
      dueDate: report.reportDate,
      id: `system-critical-${report.id}-${value.id}`,
      labId,
      note: `${value.name}: ${value.value} ${value.unit}`.trim(),
      priority: "urgent" as const,
      source: "system" as const,
      status: "open" as const,
      title: `Acknowledge ${value.status.toLowerCase()} ${value.name}`,
      type: "critical" as const,
      updatedAt: report.updatedAt,
    }];
  })).slice(0, 12);

  const unclaimedIds = unclaimedLinks.map((link) => link.labReportId).filter((id): id is string => Boolean(id));
  const unclaimedReports = unclaimedIds.length
    ? await db.collection<LabReport>("labReports").find(
      { labId, id: { $in: unclaimedIds } },
      { projection: { _id: 0 } },
    ).toArray()
    : [];
  const reportById = new Map(unclaimedReports.map((report) => [report.id, report]));
  const linkTasks = unclaimedIds.flatMap((reportId) => {
    const report = reportById.get(reportId);
    if (!report) return [];
    return [{
      actionHref: "/admin/reports?sync=unclaimed",
      clientId: report.clientId,
      clientName: report.clientName,
      clientPhone: report.clientPhone,
      createdAt: report.updatedAt,
      dueDate: report.reportDate,
      id: `system-link-${report.id}`,
      labId,
      note: `${report.reportType} is waiting for a matching patient account.`,
      priority: "medium" as const,
      source: "system" as const,
      status: "open" as const,
      title: "Link report to patient app",
      type: "report" as const,
      updatedAt: report.updatedAt,
    }];
  });

  const orderTasks = delayedOrders.map((order) => {
    const id = String(order.id || "");
    const createdAt = String(order.createdAt || new Date().toISOString());
    return {
      actionHref: "/lab#live-queue",
      clientName: String(order.patientName || "Patient"),
      clientPhone: String(order.patientPhone || ""),
      createdAt,
      dueDate: createdAt.slice(0, 10),
      id: `system-order-${id}`,
      labId,
      note: `${String(order.accessionNumber || "Order")} is still at ${String(order.stage || "ordered").replace(/_/g, " ")}.`,
      priority: order.priority === "urgent" ? "urgent" as const : "high" as const,
      source: "system" as const,
      status: "open" as const,
      title: "Review delayed sample order",
      type: "report" as const,
      updatedAt: String(order.updatedAt || createdAt),
    };
  });

  return [...criticalTasks, ...orderTasks, ...linkTasks];
}

export type { AdminContext };

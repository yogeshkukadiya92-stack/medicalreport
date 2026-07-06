import type { Db } from "mongodb";
import type { LabClient, LabProfile, LabReport } from "@/lib/vault-types";

export type LabKpis = {
  abnormalReports: number;
  pendingUnmatchedReports: number;
  publishedReports: number;
  todayReports: number;
  totalClients: number;
};

export type WorkQueue = {
  abnormalToday: number;
  missingAttachment: number;
  publishedToday: number;
  todayReports: number;
  unmatched: number;
};

export type CriticalAlert = {
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

export type SyncStatus = {
  claimedReports: number;
  claimPercentage: number;
  publishedTotal: number;
  unclaimedReports: number;
};

export type LabDashboardPayload = {
  criticalAlerts: CriticalAlert[];
  kpis: LabKpis;
  recentActivity: Record<string, unknown>[];
  syncStatus: SyncStatus;
  workQueue: WorkQueue;
};

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getLabDashboardData(db: Db, lab: Pick<LabProfile, "id">): Promise<LabDashboardPayload> {
  const today = todayDate();
  const missingAttachmentFilter = {
    labId: lab.id,
    $or: [{ fileId: { $exists: false } }, { fileId: "" }],
  };

  const [
    todayReports,
    totalClients,
    unclaimedReports,
    claimedReports,
    publishedReports,
    publishedToday,
    abnormalReports,
    abnormalToday,
    missingAttachment,
    recentActivity,
    criticalAlerts,
  ] = await Promise.all([
    db.collection<LabReport>("labReports").countDocuments({ labId: lab.id, reportDate: today }),
    db.collection<LabClient>("labClients").countDocuments({ labId: lab.id }),
    db.collection("clientReportLinks").countDocuments({ labId: lab.id, state: "unclaimed" }),
    db.collection("clientReportLinks").countDocuments({ labId: lab.id, state: "claimed" }),
    db.collection<LabReport>("labReports").countDocuments({ labId: lab.id, status: "published" }),
    db.collection<LabReport>("labReports").countDocuments({ labId: lab.id, reportDate: today, status: "published" }),
    db.collection<LabReport>("labReports").countDocuments({ labId: lab.id, abnormal: { $gt: 0 } }),
    db.collection<LabReport>("labReports").countDocuments({ labId: lab.id, reportDate: today, abnormal: { $gt: 0 } }),
    db.collection<LabReport>("labReports").countDocuments(missingAttachmentFilter),
    db
      .collection("labReportAuditLogs")
      .find({ labId: lab.id }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
    db
      .collection<LabReport>("labReports")
      .aggregate<CriticalAlert>([
        { $match: { labId: lab.id, status: "published" } },
        { $unwind: "$values" },
        { $match: { "values.status": { $in: ["High", "Low"] } } },
        { $sort: { createdAt: -1 } },
        { $limit: 8 },
        {
          $project: {
            _id: 0,
            clientName: 1,
            clientPhone: 1,
            reportDate: 1,
            reportId: "$id",
            reportTitle: "$title",
            reportType: 1,
            markerName: "$values.name",
            status: "$values.status",
            unit: "$values.unit",
            value: "$values.value",
            range: "$values.referenceRange",
          },
        },
      ])
      .toArray(),
  ]);
  const claimPercentage = publishedReports ? Math.round((claimedReports / publishedReports) * 100) : 0;

  return {
    criticalAlerts,
    kpis: {
      abnormalReports,
      pendingUnmatchedReports: unclaimedReports,
      publishedReports,
      todayReports,
      totalClients,
    },
    recentActivity,
    syncStatus: {
      claimPercentage,
      claimedReports,
      publishedTotal: publishedReports,
      unclaimedReports,
    },
    workQueue: {
      abnormalToday,
      missingAttachment,
      publishedToday,
      todayReports,
      unmatched: unclaimedReports,
    },
  };
}

import type { Db } from "mongodb";
import type { LabBooking, LabClient, LabProfile, LabReport, LabService } from "@/lib/vault-types";

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
  bookingOps: {
    activeServices: number;
    bookingLink: string;
    completedToday: number;
    homeCollections: number;
    pendingBookings: number;
    samplesToCollect: number;
    todayBookings: number;
  };
  criticalAlerts: CriticalAlert[];
  kpis: LabKpis;
  recentActivity: Record<string, unknown>[];
  recentBookings: LabBooking[];
  syncStatus: SyncStatus;
  workQueue: WorkQueue;
};

function dateKeyForTimeZone(date = new Date(), timeZone = process.env.APP_TIME_ZONE || "Asia/Kolkata") {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

export function todayDate() {
  return dateKeyForTimeZone();
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
    pendingBookings,
    todayBookings,
    homeCollections,
    samplesToCollect,
    completedToday,
    activeServices,
    recentBookings,
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
    db.collection<LabBooking>("labBookings").countDocuments({ labId: lab.id, status: { $in: ["requested", "confirmed"] } }),
    db.collection<LabBooking>("labBookings").countDocuments({ labId: lab.id, preferredDate: today }),
    db.collection<LabBooking>("labBookings").countDocuments({ labId: lab.id, collectionType: "home_collection", status: { $in: ["requested", "confirmed"] } }),
    db.collection<LabBooking>("labBookings").countDocuments({ labId: lab.id, preferredDate: today, status: "confirmed" }),
    db.collection<LabBooking>("labBookings").countDocuments({ labId: lab.id, preferredDate: today, status: { $in: ["sample_collected", "report_ready"] } }),
    db.collection<LabService>("labServices").countDocuments({ labId: lab.id, active: true }),
    db
      .collection<LabBooking>("labBookings")
      .find({ labId: lab.id }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
  ]);
  const claimPercentage = publishedReports ? Math.round((claimedReports / publishedReports) * 100) : 0;

  return {
    bookingOps: {
      activeServices,
      bookingLink: "",
      completedToday,
      homeCollections,
      pendingBookings,
      samplesToCollect,
      todayBookings,
    },
    criticalAlerts,
    kpis: {
      abnormalReports,
      pendingUnmatchedReports: unclaimedReports,
      publishedReports,
      todayReports,
      totalClients,
    },
    recentActivity,
    recentBookings,
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

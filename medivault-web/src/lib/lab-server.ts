import type { Db } from "mongodb";
import { GridFSBucket, ObjectId } from "mongodb";
import { NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { ensureNormalizedHealthIndexes, hasLabPermission, type LabPermission } from "@/lib/normalized-health";
import type { LabProfile, LabReport, LabReportAuditLog, LabUser } from "@/lib/vault-types";

export type LabContext =
  | {
      db: Db;
      lab: LabProfile;
      labUser: LabUser;
      userId: string;
    }
  | {
      error: string;
      status: number;
    };

function isoNow() {
  return new Date().toISOString();
}

function slugFromText(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || `lab-${Date.now()}`;
}

async function ensureLabIndexes(db: Db) {
  await Promise.all([
    db.collection("labs").createIndex({ id: 1 }, { unique: true }),
    db.collection("labUsers").createIndex({ userId: 1 }),
    db.collection("labUsers").createIndex({ labId: 1, userId: 1 }, { unique: true }),
    db.collection("labClients").createIndex({ labId: 1, normalizedPhone: 1 }, { unique: true }),
    db.collection("labReports").createIndex({ labId: 1, normalizedClientPhone: 1, reportType: 1, reportDate: 1 }),
    db.collection("labReports").createIndex({ normalizedClientPhone: 1, status: 1 }),
    db.collection("labReportValues").createIndex({ labId: 1, labReportId: 1 }),
    db.collection("labReportAuditLogs").createIndex({ labId: 1, labReportId: 1, createdAt: -1 }),
    db.collection("clientReportLinks").createIndex({ labId: 1, state: 1 }),
    db.collection("clientReportLinks").createIndex({ normalizedPhone: 1, userId: 1 }),
  ]);
  await ensureNormalizedHealthIndexes(db);
}

type LabCandidate = {
  lab: LabProfile;
  labUser?: LabUser;
  activityCount: number;
  reportCount: number;
};

async function findBestLabForUser(db: Db, userId: string): Promise<LabCandidate | null> {
  const [memberships, ownedLabs, reportLabIds] = await Promise.all([
    db.collection<LabUser>("labUsers").find({ userId }, { projection: { _id: 0 } }).toArray(),
    db.collection<LabProfile>("labs").find({ ownerUserId: userId }, { projection: { _id: 0 } }).toArray(),
    db.collection<LabReport>("labReports").distinct("labId", { createdByLabUserId: userId }),
  ]);
  const membershipByLabId = new Map(memberships.map((membership) => [membership.labId, membership]));
  const labIds = Array.from(new Set([
    ...memberships.map((membership) => membership.labId),
    ...ownedLabs.map((lab) => lab.id),
    ...reportLabIds.filter((labId): labId is string => typeof labId === "string" && Boolean(labId)),
  ]));

  if (!labIds.length) return null;

  const labs = await db
    .collection<LabProfile>("labs")
    .find({ id: { $in: labIds } }, { projection: { _id: 0 } })
    .toArray();
  const candidates = await Promise.all(labs.map(async (lab): Promise<LabCandidate> => {
    const [reportCount, clientCount, orderCount] = await Promise.all([
      db.collection("labReports").countDocuments({ labId: lab.id }),
      db.collection("labClients").countDocuments({ labId: lab.id }),
      db.collection("labOrders").countDocuments({ labId: lab.id }),
    ]);
    return {
      activityCount: reportCount + clientCount + orderCount,
      lab,
      labUser: membershipByLabId.get(lab.id),
      reportCount,
    };
  }));

  return candidates.sort((left, right) => {
    if (right.reportCount !== left.reportCount) return right.reportCount - left.reportCount;
    if (right.activityCount !== left.activityCount) return right.activityCount - left.activityCount;
    const rightUpdatedAt = Date.parse(right.labUser?.updatedAt || right.lab.updatedAt || right.lab.createdAt);
    const leftUpdatedAt = Date.parse(left.labUser?.updatedAt || left.lab.updatedAt || left.lab.createdAt);
    return (Number.isFinite(rightUpdatedAt) ? rightUpdatedAt : 0) - (Number.isFinite(leftUpdatedAt) ? leftUpdatedAt : 0);
  })[0] ?? null;
}

async function ensureBookingSlug(db: Db, lab: LabProfile) {
  if (lab.bookingSlug) return lab;
  const bookingSlug = `${slugFromText(lab.name)}-${lab.id.replace(/^lab-/, "").slice(-20)}`;
  await db.collection<LabProfile>("labs").updateOne({ id: lab.id }, { $set: { bookingSlug, updatedAt: isoNow() } });
  return { ...lab, bookingSlug };
}

export async function getLabContext(request: NextRequest): Promise<LabContext> {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return { error: "Sign in is required to use the lab dashboard.", status: 401 };
  }

  if (!isMongoConfigured()) {
    return { error: "MongoDB is required for lab dashboard data.", status: 503 };
  }

  const db = await getMongoDb();
  await ensureLabIndexes(db);

  const candidate = await findBestLabForUser(db, userId);
  if (candidate) {
    const now = isoNow();
    const labUser = candidate.labUser ?? {
      createdAt: now,
      id: `${candidate.lab.id}:${userId}`,
      labId: candidate.lab.id,
      role: candidate.lab.ownerUserId === userId ? "lab_admin" as const : "lab_staff" as const,
      updatedAt: now,
      userId,
    };
    if (!candidate.labUser) {
      await db.collection<LabUser>("labUsers").updateOne(
        { labId: candidate.lab.id, userId },
        { $setOnInsert: labUser },
        { upsert: true },
      );
    }
    const lab = await ensureBookingSlug(db, candidate.lab);
    return { db, lab, labUser, userId };
  }

  const now = isoNow();
  const labId = `lab-${userId}`;
  const lab: LabProfile = {
    id: labId,
    name: "MediVault Lab",
    ownerUserId: userId,
    createdAt: now,
    updatedAt: now,
  };
  const labUser: LabUser = {
    id: `${labId}:${userId}`,
    userId,
    labId,
    role: "lab_admin",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<LabProfile>("labs").updateOne(
    { id: labId },
    {
      $setOnInsert: lab,
    },
    { upsert: true },
  );
  await db.collection<LabUser>("labUsers").updateOne(
    { labId, userId },
    {
      $setOnInsert: labUser,
    },
    { upsert: true },
  );

  return { db, lab, labUser, userId };
}

export async function addLabAuditLog(
  db: Db,
  input: Pick<LabReportAuditLog, "labId" | "labReportId" | "action" | "actorUserId" | "note">,
) {
  const now = isoNow();
  const log: LabReportAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: now,
    ...input,
  };
  await db.collection<LabReportAuditLog>("labReportAuditLogs").insertOne(log);
  return log;
}

export function requireLabPermission(labUser: LabUser, permission: LabPermission) {
  if (hasLabPermission(labUser.role, permission)) return null;
  return {
    error: `Your ${labUser.role.replace("_", " ")} role cannot ${permission.replace(":", " ")}.`,
    status: 403,
  };
}

export async function userOwnsReportFile(db: Db, fileId: string, userId: string) {
  if (!fileId) return true;
  if (!ObjectId.isValid(fileId)) return false;

  const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
  const file = await bucket.find({ _id: new ObjectId(fileId), "metadata.userId": userId }).next();
  return Boolean(file);
}

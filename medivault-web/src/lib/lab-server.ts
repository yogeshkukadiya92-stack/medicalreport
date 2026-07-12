import type { Db } from "mongodb";
import { NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { LabProfile, LabReportAuditLog, LabUser } from "@/lib/vault-types";

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
    db.collection("labs").createIndex({ bookingSlug: 1 }, { unique: true, sparse: true }),
    db.collection("labUsers").createIndex({ userId: 1 }),
    db.collection("labUsers").createIndex({ labId: 1, userId: 1 }, { unique: true }),
    db.collection("labClients").createIndex({ labId: 1, normalizedPhone: 1 }, { unique: true }),
    db.collection("labReports").createIndex({ labId: 1, normalizedClientPhone: 1, reportType: 1, reportDate: 1 }),
    db.collection("labReports").createIndex({ normalizedClientPhone: 1, status: 1 }),
    db.collection("labReportValues").createIndex({ labId: 1, labReportId: 1 }),
    db.collection("labReportAuditLogs").createIndex({ labId: 1, labReportId: 1, createdAt: -1 }),
    db.collection("clientReportLinks").createIndex({ labId: 1, state: 1 }),
    db.collection("clientReportLinks").createIndex({ normalizedPhone: 1, userId: 1 }),
    db.collection("labServices").createIndex({ labId: 1, active: 1 }),
    db.collection("labBookings").createIndex({ labId: 1, preferredDate: 1, status: 1 }),
    db.collection("labBookings").createIndex({ labId: 1, normalizedPhone: 1 }),
    db.collection("labPaymentOrders").createIndex({ id: 1 }, { unique: true }),
    db.collection("labPaymentOrders").createIndex({ labId: 1, status: 1 }),
  ]);
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

  const existingLabUser = await db.collection<LabUser>("labUsers").findOne({ userId }, { projection: { _id: 0 } });
  if (existingLabUser) {
    const lab = await db.collection<LabProfile>("labs").findOne({ id: existingLabUser.labId }, { projection: { _id: 0 } });
    if (lab) {
      if (!lab.bookingSlug) {
        const bookingSlug = `${slugFromText(lab.name)}-${lab.id.replace(/^lab-/, "").slice(-20)}`;
        await db.collection<LabProfile>("labs").updateOne({ id: lab.id }, { $set: { bookingSlug, updatedAt: isoNow() } });
        lab.bookingSlug = bookingSlug;
      }
      return { db, lab, labUser: existingLabUser, userId };
    }
  }

  const now = isoNow();
  const labId = `lab-${userId}`;
  const lab: LabProfile = {
    id: labId,
    name: "MediVault Lab",
    bookingSlug: `medivault-lab-${userId.slice(-20)}`,
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

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { labReportToAppReport, normalizePhone } from "@/lib/lab-utils";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { accountPatientPhone } from "@/lib/patient-report-access";
import type { AppReport, FamilyMember, LabReport, VaultSnapshot } from "@/lib/vault-types";

export const runtime = "nodejs";

const emptyVault: VaultSnapshot = {
  activeMemberId: null,
  familyMembers: [],
  reports: [],
};

function cleanSnapshot(input: Partial<VaultSnapshot> | null): VaultSnapshot {
  return {
    activeMemberId: typeof input?.activeMemberId === "string" ? input.activeMemberId : null,
    familyMembers: Array.isArray(input?.familyMembers) ? input.familyMembers.map(cleanFamilyMember) : [],
    reports: Array.isArray(input?.reports) ? input.reports.filter((report) => report.source !== "lab") : [],
  };
}

function cleanFamilyMember(member: FamilyMember): FamilyMember {
  return {
    ...member,
    phone: typeof member.phone === "string" ? member.phone.trim() : undefined,
  };
}

async function mergePublishedLabReports(userId: string, snapshot: VaultSnapshot): Promise<VaultSnapshot> {
  const db = await getMongoDb();
  const accountPhone = await accountPatientPhone(db, userId);
  const phoneMatches = snapshot.familyMembers
    .map((member) => ({
      member,
      normalizedPhone: normalizePhone(member.phone ?? ""),
    }))
    .filter((entry) => Boolean(accountPhone) && entry.normalizedPhone === accountPhone);

  if (!phoneMatches.length) {
    return snapshot;
  }

  const labReports = await db
    .collection<LabReport>("labReports")
    .find(
      {
        normalizedClientPhone: { $in: [...new Set(phoneMatches.map((entry) => entry.normalizedPhone))] },
        status: "published",
      },
      { projection: { _id: 0 } },
    )
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  if (!labReports.length) {
    return snapshot;
  }

  const linkedReports = labReports.flatMap((report) => {
    const match = phoneMatches.find((entry) => entry.normalizedPhone === report.normalizedClientPhone);
    if (!match) return [];
    return [labReportToAppReport(report, match.member.id, match.member.name)];
  });

  if (linkedReports.length) {
    const now = new Date().toISOString();
    await db.collection("clientReportLinks").bulkWrite(
      linkedReports.map((report) => ({
        updateOne: {
          filter: { labReportId: report.labReportId },
          update: {
            $set: {
              claimedAt: now,
              memberId: report.memberId,
              normalizedPhone: normalizePhone(report.clientPhone ?? ""),
              state: "claimed",
              updatedAt: now,
              userId,
            },
            $setOnInsert: {
              createdAt: now,
              labId: report.labId,
              labReportId: report.labReportId,
            },
          },
          upsert: true,
        },
      })),
    );
  }

  const reportMap = new Map(snapshot.reports.map((report) => [report.id, report]));
  linkedReports.forEach((report) => reportMap.set(report.id, report));

  return {
    ...snapshot,
    reports: [...reportMap.values()].sort((first, second) => (second.createdAt ?? 0) - (first.createdAt ?? 0)),
  };
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to load cloud vault data." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ isConfigured: false, vault: null });
  }

  const db = await getMongoDb();
  const vault = await db.collection("vaults").findOne<{ snapshot?: VaultSnapshot }>({ userId });
  const snapshot = vault?.snapshot ? await mergePublishedLabReports(userId, cleanSnapshot(vault.snapshot)) : null;

  return NextResponse.json({
    isConfigured: true,
    vault: snapshot,
  });
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to save cloud vault data." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ isConfigured: false, saved: false });
  }

  const body = (await request.json().catch(() => null)) as Partial<VaultSnapshot> | null;
  const snapshot = cleanSnapshot(body);
  const db = await getMongoDb();
  const now = new Date();

  await db.collection("vaults").updateOne(
    { userId },
    {
      $set: {
        snapshot,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        userId,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ isConfigured: true, saved: true, vault: snapshot || emptyVault });
}

/** Native edits update only their own record, preserving edits from other devices. */
export async function PATCH(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "Cloud vault is unavailable." }, { status: 503 });
  const body = await request.json().catch(() => null) as {
    action?: string; member?: FamilyMember; memberId?: string; report?: AppReport; reportId?: string;
  } | null;
  const db = await getMongoDb();
  const vaults = db.collection<{ userId: string; snapshot: VaultSnapshot; updatedAt: Date }>("vaults");
  const now = new Date();
  let saved;
  if (body?.action === "add_member") {
    const member = body.member;
    if (!member || typeof member.id !== "string" || !member.id || typeof member.name !== "string" || !member.name.trim()) {
      return NextResponse.json({ error: "A valid family profile is required." }, { status: 400 });
    }
    // Pipeline upsert also makes a repeated request for the same ID idempotent.
    saved = await vaults.findOneAndUpdate({ userId }, [{ $set: {
      userId: { $literal: userId }, updatedAt: now,
      "snapshot.activeMemberId": { $literal: member.id },
      "snapshot.reports": { $ifNull: ["$snapshot.reports", []] },
      "snapshot.familyMembers": { $concatArrays: [
        { $filter: { input: { $ifNull: ["$snapshot.familyMembers", []] }, as: "member", cond: { $ne: ["$$member.id", { $literal: member.id }] } } },
        { $literal: [cleanFamilyMember(member)] },
      ] },
    } }], { upsert: true, returnDocument: "after" });
  } else if (body?.action === "select_member" && typeof body.memberId === "string") {
    saved = await vaults.findOneAndUpdate({ userId, "snapshot.familyMembers.id": body.memberId },
      { $set: { "snapshot.activeMemberId": body.memberId, updatedAt: now } }, { returnDocument: "after" });
  } else if (body?.action === "delete_report" && typeof body.reportId === "string") {
    saved = await vaults.findOneAndUpdate({ userId },
      { $pull: { "snapshot.reports": { id: body.reportId, source: { $ne: "lab" } } }, $set: { updatedAt: now } },
      { returnDocument: "after" });
  } else if (body?.action === "save_report") {
    const report = body.report;
    if (!report || typeof report.id !== "string" || !report.id || report.id.startsWith("lab-") || report.source === "lab" ||
        typeof report.memberId !== "string" || typeof report.title !== "string" || !Array.isArray(report.markers)) {
      return NextResponse.json({ error: "A valid self-uploaded report is required." }, { status: 400 });
    }
    saved = await vaults.findOneAndUpdate({ userId, "snapshot.familyMembers.id": report.memberId }, [{ $set: {
      updatedAt: now,
      "snapshot.reports": { $concatArrays: [
        { $literal: [{ ...report, source: "self_upload" }] },
        { $filter: { input: { $ifNull: ["$snapshot.reports", []] }, as: "report", cond: { $ne: ["$$report.id", { $literal: report.id }] } } },
      ] },
    } }], { returnDocument: "after" });
  } else {
    return NextResponse.json({ error: "Unsupported vault change." }, { status: 400 });
  }
  if (!saved) return NextResponse.json({ error: "The family profile or vault no longer exists. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ saved: true, vault: await mergePublishedLabReports(userId, cleanSnapshot(saved.snapshot)) });
}

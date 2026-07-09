import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { labReportToAppReport, normalizePhone } from "@/lib/lab-utils";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { FamilyMember, LabReport, VaultSnapshot } from "@/lib/vault-types";

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
  const phoneMatches = snapshot.familyMembers
    .map((member) => ({
      member,
      normalizedPhone: normalizePhone(member.phone ?? ""),
    }))
    .filter((entry) => entry.normalizedPhone.length >= 8);

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

  const mergedSnapshot = await mergePublishedLabReports(userId, snapshot || emptyVault);

  return NextResponse.json({ isConfigured: true, saved: true, vault: mergedSnapshot });
}

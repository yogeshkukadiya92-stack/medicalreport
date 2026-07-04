import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { VaultSnapshot } from "@/lib/vault-types";

export const runtime = "nodejs";

const emptyVault: VaultSnapshot = {
  activeMemberId: null,
  familyMembers: [],
  reports: [],
};

function cleanSnapshot(input: Partial<VaultSnapshot> | null): VaultSnapshot {
  return {
    activeMemberId: typeof input?.activeMemberId === "string" ? input.activeMemberId : null,
    familyMembers: Array.isArray(input?.familyMembers) ? input.familyMembers : [],
    reports: Array.isArray(input?.reports) ? input.reports : [],
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

  return NextResponse.json({
    isConfigured: true,
    vault: vault?.snapshot ? cleanSnapshot(vault.snapshot) : null,
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

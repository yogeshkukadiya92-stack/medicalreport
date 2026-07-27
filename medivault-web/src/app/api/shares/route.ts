import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import {
  createShareToken,
  ensureSecureShareIndexes,
  findOwnedReport,
  publicShare,
  type SecureShare,
} from "@/lib/secure-share";

export const runtime = "nodejs";

function clean(value: unknown, length: number) {
  return typeof value === "string" ? value.trim().slice(0, length) : "";
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "Secure sharing requires MongoDB." }, { status: 503 });
  const db = await getMongoDb();
  await ensureSecureShareIndexes(db);
  const shares = await db.collection<SecureShare>("secureShares")
    .find({ userId }, { projection: { _id: 0, tokenHash: 0, userId: 0 } })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return NextResponse.json({ shares });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ error: "Secure sharing requires MongoDB." }, { status: 503 });
  const body = await request.json().catch(() => null) as { expiresInHours?: number; recipientLabel?: string; reportId?: string } | null;
  const reportId = clean(body?.reportId, 160);
  const expiresInHours = Math.min(24 * 30, Math.max(1, Math.round(Number(body?.expiresInHours) || 24)));
  const db = await getMongoDb();
  await ensureSecureShareIndexes(db);
  const report = await findOwnedReport(db, userId, reportId);
  if (!report) return NextResponse.json({ error: "Report was not found in your health vault." }, { status: 404 });

  const now = new Date();
  const generated = createShareToken();
  const share: SecureShare = {
    accessCount: 0,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString(),
    id: `share-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    recipientLabel: clean(body?.recipientLabel, 80) || undefined,
    reportId: report.id,
    reportSnapshot: report,
    tokenHash: generated.tokenHash,
    tokenPrefix: generated.tokenPrefix,
    userId,
  };
  await db.collection<SecureShare>("secureShares").insertOne(share);
  await db.collection("secureShareAuditLogs").insertOne({
    action: "created",
    createdAt: now.toISOString(),
    id: `share-audit-${crypto.randomUUID()}`,
    shareId: share.id,
    userId,
  });
  return NextResponse.json({
    share: publicShare(share),
    url: `${request.nextUrl.origin}/share/${generated.token}`,
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const shareId = clean(request.nextUrl.searchParams.get("shareId"), 160);
  if (!shareId) return NextResponse.json({ error: "Share id is required." }, { status: 400 });
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const result = await db.collection<SecureShare>("secureShares").updateOne(
    { id: shareId, userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: now } },
  );
  if (!result.matchedCount) return NextResponse.json({ error: "Active share was not found." }, { status: 404 });
  await db.collection("secureShareAuditLogs").insertOne({
    action: "revoked",
    createdAt: now,
    id: `share-audit-${crypto.randomUUID()}`,
    shareId,
    userId,
  });
  return NextResponse.json({ revoked: true });
}

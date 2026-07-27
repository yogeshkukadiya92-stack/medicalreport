import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";
import { ensureSecureShareIndexes, hashShareToken, publicShare, type SecureShare } from "@/lib/secure-share";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimit = checkRateLimit(clientKey(request, "public-secure-share"), { limit: 60, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
  }
  if (!isMongoConfigured()) return NextResponse.json({ error: "Secure sharing is unavailable." }, { status: 503 });
  const { token } = await params;
  if (!token || token.length < 32) return NextResponse.json({ error: "Invalid share link." }, { status: 404 });
  const db = await getMongoDb();
  await ensureSecureShareIndexes(db);
  const now = new Date();
  const share = await db.collection<SecureShare>("secureShares").findOne(
    {
      expiresAt: { $gt: now.toISOString() },
      revokedAt: { $exists: false },
      tokenHash: hashShareToken(token),
    },
    { projection: { _id: 0 } },
  );
  if (!share) return NextResponse.json({ error: "This share link is invalid, expired, or revoked." }, { status: 410 });
  const accessedAt = now.toISOString();
  await Promise.all([
    db.collection<SecureShare>("secureShares").updateOne(
      { id: share.id },
      { $inc: { accessCount: 1 }, $set: { lastAccessedAt: accessedAt } },
    ),
    db.collection("secureShareAuditLogs").insertOne({
      action: "viewed",
      createdAt: accessedAt,
      id: `share-audit-${crypto.randomUUID()}`,
      shareId: share.id,
      userAgent: request.headers.get("user-agent")?.slice(0, 180),
    }),
  ]);
  return NextResponse.json({ share: publicShare({ ...share, accessCount: share.accessCount + 1, lastAccessedAt: accessedAt }) });
}

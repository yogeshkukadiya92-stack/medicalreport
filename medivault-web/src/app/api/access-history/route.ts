import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { SecureShare } from "@/lib/secure-share";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ events: [] });
  const db = await getMongoDb();
  const shares = await db.collection<SecureShare>("secureShares")
    .find({ userId }, { projection: { _id: 0, id: 1, recipientLabel: 1, reportSnapshot: 1 } })
    .limit(200).toArray();
  const shareById = new Map(shares.map((share) => [share.id, share]));
  const [shareEvents, consentEvents, sessionEvents, dataAccessEvents] = await Promise.all([
    shares.length
      ? db.collection("secureShareAuditLogs").find(
        { shareId: { $in: shares.map((share) => share.id) } },
        { projection: { _id: 0 } },
      ).sort({ createdAt: -1 }).limit(300).toArray()
      : [],
    db.collection("consentAuditLogs").find({ userId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 }).limit(200).toArray(),
    db.collection("authSessions").find({ userId }, { projection: { _id: 0, createdAt: 1, lastSeenAt: 1, id: 1 } })
      .sort({ lastSeenAt: -1 }).limit(50).toArray(),
    db.collection("dataAccessLogs").find({ userId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 }).limit(200).toArray(),
  ]);
  const events = [
    ...shareEvents.map((event) => {
      const share = shareById.get(String(event.shareId));
      return {
        action: event.action,
        actor: event.action === "viewed" ? share?.recipientLabel || "Secure-link recipient" : "You",
        createdAt: event.createdAt,
        id: event.id,
        resource: share?.reportSnapshot?.title || "Shared report",
        type: "report_share",
      };
    }),
    ...consentEvents.map((event) => ({
      action: event.action,
      actor: "You",
      createdAt: event.createdAt,
      id: event.id,
      resource: event.consentType,
      type: "consent",
    })),
    ...sessionEvents.map((event) => ({
      action: "session_active",
      actor: "Your account",
      createdAt: event.lastSeenAt || event.createdAt,
      id: event.id,
      resource: "MediVault sign-in",
      type: "authentication",
    })),
    ...dataAccessEvents.map((event) => ({
      action: event.action,
      actor: "Your account",
      createdAt: event.createdAt,
      id: event.id,
      resource: event.resourceName || "Medical report",
      type: "file_access",
    })),
  ].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt))).slice(0, 300);
  return NextResponse.json({ events });
}

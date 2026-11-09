import { GridFSBucket } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getAuthenticatedUser, isBootstrapAdminUser, verifyAuthUserPassword } from "@/lib/auth-server";
import { getMongoDb } from "@/lib/mongodb";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const limit = checkRateLimit(clientKey(request, `delete-account:${user.id}`), { limit: 5, windowMs: 30 * 60 * 1000 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many deletion attempts. Try again later." }, { status: 429, headers: rateLimitHeaders(limit) });
  const body = await request.json().catch(() => null);
  if (body?.confirmation !== "DELETE" || typeof body?.password !== "string" || !body.password || body.password.length > 256) {
    return NextResponse.json({ error: "Enter your password and confirm permanent deletion." }, { status: 400 });
  }
  if (!await verifyAuthUserPassword(user.id, body.password)) return NextResponse.json({ error: "Your password is incorrect." }, { status: 401 });
  const db = await getMongoDb();
  if (isBootstrapAdminUser(user) || await db.collection("labUsers").findOne({ userId: user.id })) {
    return NextResponse.json({ error: "This account manages an organization. Transfer or close the organization through its administrator before deleting the account." }, { status: 409 });
  }
  try {
    await db.collection("authUsers").updateOne({ id: user.id }, { $set: { accountStatus: "suspended" } });
    const shareIds = await db.collection<{ id: string; userId: string }>("secureShares").find({ userId: user.id }, { projection: { id: 1 } }).map(share => share.id).toArray();
    const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
    for await (const file of bucket.find({ "metadata.userId": user.id })) {
      try { await bucket.delete(file._id); } catch (error) {
        if (!(error instanceof Error) || !/FileNotFound|File not found/i.test(error.message)) throw error;
      }
    }
    // Provider-owned clinical records are independent records and are not removed.
    await db.collection("secureShareAuditLogs").deleteMany({ $or: [{ userId: user.id }, { shareId: { $in: shareIds } }] });
    for (const collection of ["vaults", "secureShares", "consents", "consentAuditLogs", "dataAccessLogs", "clientReportLinks", "authSessions"]) {
      await db.collection(collection).deleteMany({ userId: user.id });
    }
    await db.collection("authUsers").deleteOne({ id: user.id });
    const response = NextResponse.json({ deleted: true });
    clearAuthCookie(response);
    return response;
  } catch {
    await db.collection("authUsers").updateOne({ id: user.id }, { $set: { accountStatus: "active" } }).catch(() => null);
    return NextResponse.json({ error: "Deletion could not finish. Some uploaded data may already be removed. Sign in again and retry to finish deleting your account." }, { status: 503 });
  }
}

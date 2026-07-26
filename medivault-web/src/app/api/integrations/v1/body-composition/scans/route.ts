import { NextRequest, NextResponse } from "next/server";
import { authenticateIntegrationKey } from "@/lib/integration-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const db = await getMongoDb();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  const apiKey = await authenticateIntegrationKey(db, bearer, "body_composition.read");
  if (!apiKey) {
    return NextResponse.json({ error: "Valid API key with body_composition.read scope is required." }, { status: 401 });
  }
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 25));
  const scans = await db.collection<LabReport>("labReports").find(
    {
      labId: apiKey.labId,
      $or: [
        { reportType: { $regex: /body composition|inbody|bmi/i } },
        { title: { $regex: /body composition|inbody|bmi/i } },
      ],
    },
    { projection: { _id: 0 } },
  ).sort({ createdAt: -1 }).limit(limit).toArray();
  return NextResponse.json({ data: scans, hasMore: scans.length === limit, object: "list" });
}

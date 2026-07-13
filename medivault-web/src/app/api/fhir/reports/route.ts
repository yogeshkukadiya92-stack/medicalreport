import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { normalizePhone } from "@/lib/lab-utils";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { ensureNormalizedHealthIndexes, type NormalizedDiagnosticRecord, type NormalizedObservationRecord } from "@/lib/normalized-health";

export const runtime = "nodejs";

function cleanText(value: string | null) {
  return value?.trim() ?? "";
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to access normalized health data." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ isConfigured: false, reports: [], observations: [] });
  }

  const params = request.nextUrl.searchParams;
  const phone = normalizePhone(cleanText(params.get("phone")));
  const labId = cleanText(params.get("labId"));
  const reportType = cleanText(params.get("reportType"));
  const marker = cleanText(params.get("marker"));
  const from = cleanText(params.get("from"));
  const to = cleanText(params.get("to"));

  const db = await getMongoDb();
  await ensureNormalizedHealthIndexes(db);

  const reportFilter: Record<string, unknown> = {};
  if (phone) reportFilter.normalizedClientPhone = phone;
  if (labId) reportFilter.labId = labId;
  if (reportType) reportFilter.reportType = reportType;
  if (from || to) {
    reportFilter.reportDate = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }

  const reports = await db
    .collection<NormalizedDiagnosticRecord>("normalizedDiagnosticReports")
    .find(reportFilter, { projection: { _id: 0 } })
    .sort({ reportDate: -1 })
    .limit(100)
    .toArray();

  const observationFilter: Record<string, unknown> = {};
  if (phone) observationFilter.normalizedClientPhone = phone;
  if (labId) observationFilter.labId = labId;
  if (marker) observationFilter.name = marker;

  const observations = await db
    .collection<NormalizedObservationRecord>("normalizedObservations")
    .find(observationFilter, { projection: { _id: 0 } })
    .sort({ "observation.effectiveDateTime": 1 })
    .limit(500)
    .toArray();

  return NextResponse.json({
    isConfigured: true,
    observations,
    reports,
  });
}

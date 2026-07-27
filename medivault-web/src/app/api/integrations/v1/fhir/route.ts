import { NextRequest, NextResponse } from "next/server";
import { authenticateIntegrationKey } from "@/lib/integration-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { NormalizedDiagnosticRecord, NormalizedObservationRecord, NormalizedSpecimenRecord } from "@/lib/normalized-health";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const db = await getMongoDb();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  const apiKey = await authenticateIntegrationKey(db, bearer, "lab.read");
  if (!apiKey) return NextResponse.json({ error: "Valid API key with lab.read scope is required." }, { status: 401 });
  const reportId = request.nextUrl.searchParams.get("reportId")?.trim();
  const filter = { labId: apiKey.labId, ...(reportId ? { labReportId: reportId } : {}) };
  const [reports, observations, specimens] = await Promise.all([
    db.collection<NormalizedDiagnosticRecord>("normalizedDiagnosticReports").find(filter).limit(100).toArray(),
    db.collection<NormalizedObservationRecord>("normalizedObservations").find(filter).limit(1000).toArray(),
    db.collection<NormalizedSpecimenRecord>("normalizedSpecimens").find(filter).limit(100).toArray(),
  ]);
  const resources = [
    ...reports.map((item) => item.diagnosticReport),
    ...observations.map((item) => item.observation),
    ...specimens.map((item) => item.specimen),
  ];
  return NextResponse.json({
    entry: resources.map((resource) => ({
      fullUrl: `${request.nextUrl.origin}/api/integrations/v1/fhir/${resource.resourceType}/${resource.id}`,
      resource,
    })),
    resourceType: "Bundle",
    total: resources.length,
    type: "searchset",
  }, { headers: { "Content-Type": "application/fhir+json" } });
}

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { parseHl7Oru } from "@/lib/hl7";
import { authenticateIntegrationKey, emitIntegrationEvent } from "@/lib/integration-server";
import { normalizePhone } from "@/lib/lab-utils";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { syncNormalizedLabReport } from "@/lib/normalized-health";
import type { LabClient, LabProfile, LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isMongoConfigured()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const db = await getMongoDb();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  const apiKey = await authenticateIntegrationKey(db, bearer, "lab.write");
  if (!apiKey) return NextResponse.json({ error: "Valid API key with lab.write scope is required." }, { status: 401 });
  const raw = (await request.text()).slice(0, 1_000_000);
  let parsed;
  try {
    parsed = parseHl7Oru(raw);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid HL7 message." }, { status: 400 });
  }
  if (!parsed.messageControlId) return NextResponse.json({ error: "MSH-10 message control ID is required." }, { status: 400 });
  const duplicate = await db.collection("hl7Messages").findOne({ labId: apiKey.labId, messageControlId: parsed.messageControlId });
  if (duplicate) return NextResponse.json({ duplicate: true, reportId: duplicate.reportId }, { status: 200 });
  const lab = await db.collection<LabProfile>("labs").findOne({ id: apiKey.labId });
  if (!lab) return NextResponse.json({ error: "Clinic was not found." }, { status: 404 });
  const now = new Date().toISOString();
  const normalizedPhone = normalizePhone(parsed.clientPhone);
  if (!normalizedPhone) return NextResponse.json({ error: "PID-13 patient phone is required for matching." }, { status: 400 });
  const existingClient = await db.collection<LabClient>("labClients").findOne({ labId: apiKey.labId, normalizedPhone });
  const client: LabClient = existingClient ?? {
    createdAt: now,
    id: `client-${crypto.randomUUID()}`,
    labId: apiKey.labId,
    name: parsed.clientName,
    normalizedPhone,
    phone: parsed.clientPhone,
    updatedAt: now,
  };
  if (!existingClient) await db.collection<LabClient>("labClients").insertOne(client);
  const reportId = `report-${crypto.randomUUID()}`;
  const values = parsed.observations.map((item) => ({
    createdAt: now,
    id: `value-${crypto.randomUUID()}`,
    labId: apiKey.labId,
    labReportId: reportId,
    name: item.name,
    notes: "Imported from HL7 v2 ORU",
    referenceRange: item.referenceRange,
    status: item.status,
    unit: item.unit,
    updatedAt: now,
    value: item.value,
  }));
  const report: LabReport = {
    abnormal: values.filter((item) => item.status === "High" || item.status === "Low").length,
    accessionNumber: parsed.accessionNumber,
    clientId: client.id,
    clientName: client.name,
    clientPhone: client.phone,
    createdAt: now,
    createdByLabUserId: `integration:${apiKey.id}`,
    entrySource: "machine",
    id: reportId,
    labId: apiKey.labId,
    labName: lab.name,
    labReportId: `HL7-${parsed.messageControlId}`,
    normalizedClientPhone: normalizedPhone,
    parameters: values.length,
    reportDate: parsed.reportDate,
    reportType: parsed.reportType,
    status: "draft",
    summary: `Imported from HL7 ORU with ${values.length} observations.`,
    title: `${parsed.reportType} - ${client.name}`,
    updatedAt: now,
    values,
    workflowStatus: "entered",
  };
  await Promise.all([
    db.collection<LabReport>("labReports").insertOne(report),
    db.collection("hl7Messages").insertOne({
      createdAt: now, id: `hl7-${crypto.randomUUID()}`, labId: apiKey.labId,
      messageControlId: parsed.messageControlId, reportId,
    }),
  ]);
  await syncNormalizedLabReport(db, report, `integration:${apiKey.id}`);
  await emitIntegrationEvent(db, apiKey.labId, "lab.report.created", report);
  return NextResponse.json({ data: report, object: "lab_report" }, { status: 201 });
}

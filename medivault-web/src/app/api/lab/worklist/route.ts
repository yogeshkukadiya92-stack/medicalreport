import { NextRequest, NextResponse } from "next/server";
import { addLabAuditLog, getLabContext, requireLabPermission } from "@/lib/lab-server";
import { syncNormalizedLabReport } from "@/lib/normalized-health";
import type { LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

type WorklistOrder = {
  id: string;
  labId: string;
  accessionNumber: string;
  patientName: string;
  patientPhone: string;
  testName: string;
  sampleType: string;
  priority: string;
  stage: string;
  createdAt: string;
  updatedAt: string;
};

function clean(value: unknown, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function readWorklist(context: Exclude<Awaited<ReturnType<typeof getLabContext>>, { error: string; status: number }>) {
  const [orders, reports, events] = await Promise.all([
    context.db.collection<WorklistOrder>("labOrders")
      .find({ labId: context.lab.id }, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray(),
    context.db.collection<LabReport>("labReports")
      .find({ labId: context.lab.id, status: "draft" }, { projection: { _id: 0 } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray(),
    context.db.collection("sampleEvents")
      .find({ labId: context.lab.id }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  ]);
  const reportByAccession = new Map(reports.map((report) => [report.accessionNumber, report]));
  const eventsByAccession = new Map<string, unknown[]>();
  events.forEach((event) => {
    const accession = String(event.accessionNumber || "");
    eventsByAccession.set(accession, [...(eventsByAccession.get(accession) ?? []), event]);
  });
  return {
    role: context.labUser.role,
    items: orders.map((order) => ({
      ...order,
      report: reportByAccession.get(order.accessionNumber) ?? null,
      events: eventsByAccession.get(order.accessionNumber) ?? [],
    })),
  };
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  return NextResponse.json(await readWorklist(context));
}

export async function POST(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Workflow action is required." }, { status: 400 });
  const action = clean(body.action, 50);
  const reportId = clean(body.reportId, 120);
  const now = new Date().toISOString();

  if (action === "technician_review") {
    const denied = requireLabPermission(context.labUser, "reports:enter");
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
    const report = await context.db.collection<LabReport>("labReports").findOne(
      { id: reportId, labId: context.lab.id, status: "draft" },
      { projection: { _id: 0 } },
    );
    if (!report) return NextResponse.json({ error: "Draft report was not found." }, { status: 404 });
    if (!report.values.length) return NextResponse.json({ error: "Enter at least one result before technician review." }, { status: 409 });
    await context.db.collection<LabReport>("labReports").updateOne(
      { id: report.id, labId: context.lab.id },
      { $set: { workflowStatus: "technician_reviewed", technicianReviewedAt: now, technicianReviewedByUserId: context.userId, updatedAt: now } },
    );
    await addLabAuditLog(context.db, { action: "update", actorUserId: context.userId, labId: context.lab.id, labReportId: report.id, note: "Results reviewed by technician." });
    return NextResponse.json({ message: "Technician review completed.", worklist: await readWorklist(context) });
  }

  if (action === "pathologist_verify") {
    const denied = requireLabPermission(context.labUser, "reports:verify");
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
    const report = await context.db.collection<LabReport>("labReports").findOne(
      { id: reportId, labId: context.lab.id, status: "draft" },
      { projection: { _id: 0 } },
    );
    if (!report) return NextResponse.json({ error: "Draft report was not found." }, { status: 404 });
    if (report.workflowStatus !== "technician_reviewed") {
      return NextResponse.json({ error: "Technician review is required before pathologist verification." }, { status: 409 });
    }
    await context.db.collection<LabReport>("labReports").updateOne(
      { id: report.id, labId: context.lab.id },
      { $set: { workflowStatus: "pathologist_verified", verifiedAt: now, verifiedByUserId: context.userId, updatedAt: now } },
    );
    await addLabAuditLog(context.db, { action: "update", actorUserId: context.userId, labId: context.lab.id, labReportId: report.id, note: "Report verified by pathologist." });
    return NextResponse.json({ message: "Pathologist verification completed.", worklist: await readWorklist(context) });
  }

  if (action === "publish_verified") {
    const denied = requireLabPermission(context.labUser, "reports:publish");
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
    const report = await context.db.collection<LabReport>("labReports").findOne(
      { id: reportId, labId: context.lab.id, status: "draft" },
      { projection: { _id: 0 } },
    );
    if (!report) return NextResponse.json({ error: "Draft report was not found." }, { status: 404 });
    if (report.workflowStatus !== "pathologist_verified") {
      return NextResponse.json({ error: "Pathologist verification is required before publish." }, { status: 409 });
    }
    await context.db.collection<LabReport>("labReports").updateOne(
      { id: report.id, labId: context.lab.id },
      { $set: { status: "published", publishedAt: now, updatedAt: now } },
    );
    await context.db.collection("clientReportLinks").updateOne(
      { labReportId: report.id },
      {
        $set: { labId: context.lab.id, labReportId: report.id, normalizedPhone: report.normalizedClientPhone, state: "unclaimed", updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    if (report.accessionNumber) {
      await context.db.collection("labOrders").updateOne(
        { accessionNumber: report.accessionNumber, labId: context.lab.id },
        { $set: { stage: "reported", updatedAt: now } },
      );
    }
    const published = { ...report, status: "published" as const, publishedAt: now, updatedAt: now };
    let syncWarning = "";
    try {
      await syncNormalizedLabReport(context.db, published, context.userId);
    } catch (syncError) {
      syncWarning = syncError instanceof Error ? syncError.message : "FHIR normalization could not finish.";
    }
    await addLabAuditLog(context.db, { action: "publish", actorUserId: context.userId, labId: context.lab.id, labReportId: report.id, note: "Verified report published to patient app." });
    await context.db.collection("labOperationalAudit").insertOne({
      action: "verified_report_published",
      createdAt: now,
      entityId: report.id,
      labId: context.lab.id,
      note: `${report.accessionNumber || report.labReportId} verified and published.`,
      userId: context.userId,
    });
    return NextResponse.json({
      message: syncWarning ? `Verified report published. FHIR sync warning: ${syncWarning}` : "Verified report published to patient app.",
      worklist: await readWorklist(context),
    });
  }

  return NextResponse.json({ error: "Unsupported workflow action." }, { status: 400 });
}

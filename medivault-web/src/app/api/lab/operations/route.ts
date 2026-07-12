import { NextRequest, NextResponse } from "next/server";
import { GET as getDocumentCenter, POST as generateDocument } from "@/app/api/lab/document-center/route";
import { getLabContext } from "@/lib/lab-server";

export const runtime = "nodejs";

const stages = ["ordered", "sample_collected", "sample_received", "in_analysis", "ready_for_verification", "reported"] as const;
type OrderStage = (typeof stages)[number];

type LabOrder = {
  accessionNumber: string;
  createdAt: string;
  createdByUserId: string;
  id: string;
  labId: string;
  patientName: string;
  patientPhone: string;
  priority: "routine" | "urgent";
  sampleType: string;
  stage: OrderStage;
  testName: string;
  updatedAt: string;
};

type ReportDoc = {
  accessionNumber?: string;
  abnormal?: number;
  clientName?: string;
  clientPhone?: string;
  id: string;
  labId: string;
  publishedAt?: string;
  reportDate?: string;
  reportType?: string;
  sampleCollectedAt?: string;
  title?: string;
  values?: Array<{ name?: string; referenceRange?: string; status?: string; unit?: string; value?: string }>;
};

type CriticalAck = {
  acknowledgedAt: string;
  acknowledgedByUserId: string;
  labId: string;
  markerName: string;
  reportId: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(-15);
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata" }).format(new Date());
}

function averageTatMinutes(reports: ReportDoc[]) {
  const durations = reports.flatMap((report) => {
    if (!report.sampleCollectedAt || !report.publishedAt) return [];
    const start = Date.parse(report.sampleCollectedAt);
    const end = Date.parse(report.publishedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
    return [(end - start) / 60_000];
  });
  return durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;
}

async function readOperations(context: Exclude<Awaited<ReturnType<typeof getLabContext>>, { error: string; status: number }>) {
  const labId = context.lab.id;
  const [orders, reports, links, acknowledgements, analyzerConnections, qcRuns, invoices, activity] = await Promise.all([
    context.db.collection<LabOrder>("labOrders").find({ labId }, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).limit(30).toArray(),
    context.db.collection<ReportDoc>("labReports").find({ labId }, { projection: { _id: 0 } }).sort({ publishedAt: -1, reportDate: -1 }).limit(50).toArray(),
    context.db.collection("clientReportLinks").find({ labId }, { projection: { _id: 0 } }).toArray(),
    context.db.collection<CriticalAck>("criticalValueAcknowledgements").find({ labId }, { projection: { _id: 0 } }).toArray(),
    context.db.collection("analyzerConnections").countDocuments({ labId, enabled: true }),
    context.db.collection("qualityControlRuns").countDocuments({ labId }),
    context.db.collection("billingInvoices").countDocuments({ labId }),
    context.db.collection("labOperationalAudit").find({ labId }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(8).toArray(),
  ]);

  const ackMap = new Map(acknowledgements.map((item) => [`${item.reportId}:${item.markerName.toLowerCase()}`, item]));
  const criticalAlerts = reports.flatMap((report) => (report.values ?? []).flatMap((marker) => {
    if (marker.status !== "High" && marker.status !== "Low") return [];
    const markerName = cleanText(marker.name) || "Critical result";
    const acknowledgement = ackMap.get(`${report.id}:${markerName.toLowerCase()}`);
    return [{
      acknowledgedAt: acknowledgement?.acknowledgedAt ?? null,
      clientName: report.clientName || "Patient",
      clientPhone: report.clientPhone || "",
      markerName,
      range: cleanText(marker.referenceRange),
      reportDate: report.reportDate || "",
      reportId: report.id,
      reportTitle: report.title || report.reportType || "Lab report",
      status: marker.status,
      unit: cleanText(marker.unit),
      value: cleanText(marker.value),
    }];
  })).slice(0, 12);

  const linkMap = new Map(links.map((link) => [String(link.labReportId), String(link.state || "unclaimed")]));
  const delivery = reports.slice(0, 10).map((report) => ({
    clientName: report.clientName || "Patient",
    reportDate: report.reportDate || "",
    reportId: report.id,
    reportTitle: report.title || report.reportType || "Lab report",
    state: linkMap.get(report.id) === "claimed" ? "visible_in_patient_app" : "waiting_for_patient_match",
  }));

  const now = Date.now();
  const reportedAccessions = new Set(reports.map((report) => cleanText(report.accessionNumber)).filter(Boolean));
  const enrichedOrders = orders.map((order) => ({
    ...order,
    stage: reportedAccessions.has(order.accessionNumber) ? "reported" as const : order.stage,
    delayed: order.stage !== "reported" && !reportedAccessions.has(order.accessionNumber) && now - Date.parse(order.createdAt) > 2 * 60 * 60 * 1000,
    elapsedMinutes: Math.max(0, Math.round((now - Date.parse(order.createdAt)) / 60_000)),
  }));
  const today = todayKey();

  return {
    activity,
    criticalAlerts,
    delivery,
    featureAvailability: {
      analyzer: analyzerConnections > 0,
      billing: invoices > 0,
      qc: qcRuns > 0,
    },
    metrics: {
      averageTatMinutes: averageTatMinutes(reports),
      criticalUnacknowledged: criticalAlerts.filter((item) => !item.acknowledgedAt).length,
      delayedOrders: enrichedOrders.filter((item) => item.delayed).length,
      pendingVerification: enrichedOrders.filter((item) => item.stage === "ready_for_verification").length,
      reportsToday: reports.filter((item) => item.reportDate === today).length,
      samplesPending: enrichedOrders.filter((item) => !["ready_for_verification", "reported"].includes(item.stage)).length,
    },
    orders: enrichedOrders,
  };
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("view") === "document-center") return getDocumentCenter(request);

  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  await Promise.all([
    context.db.collection("labOrders").createIndex({ labId: 1, accessionNumber: 1 }, { unique: true }),
    context.db.collection("labOrders").createIndex({ labId: 1, stage: 1, updatedAt: -1 }),
    context.db.collection("criticalValueAcknowledgements").createIndex({ labId: 1, reportId: 1, markerName: 1 }, { unique: true }),
    context.db.collection("labOperationalAudit").createIndex({ labId: 1, createdAt: -1 }),
  ]);

  return NextResponse.json(await readOperations(context));
}

export async function POST(request: NextRequest) {
  const requestBody = (await request.clone().json().catch(() => null)) as Record<string, unknown> | null;
  if (cleanText(requestBody?.action) === "generate_document") return generateDocument(request);

  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = requestBody;
  const action = cleanText(body?.action);
  const now = new Date().toISOString();

  if (action === "create_order") {
    const patientName = cleanText(body?.patientName);
    const patientPhone = phoneDigits(cleanText(body?.patientPhone));
    const testName = cleanText(body?.testName);
    const sampleType = cleanText(body?.sampleType) || "Blood";
    if (!patientName || patientPhone.length < 8 || !testName) {
      return NextResponse.json({ error: "Patient name, valid phone and test name are required." }, { status: 400 });
    }
    const suffix = `${Date.now()}`.slice(-8);
    const order: LabOrder = {
      accessionNumber: `MV-${suffix}`,
      createdAt: now,
      createdByUserId: context.userId,
      id: `order-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      labId: context.lab.id,
      patientName,
      patientPhone,
      priority: body?.priority === "urgent" ? "urgent" : "routine",
      sampleType,
      stage: "ordered",
      testName,
      updatedAt: now,
    };
    await context.db.collection<LabOrder>("labOrders").insertOne(order);
    await context.db.collection("labOperationalAudit").insertOne({ action: "order_created", createdAt: now, entityId: order.id, labId: context.lab.id, note: `${order.accessionNumber} created for ${patientName}.`, userId: context.userId });
    return NextResponse.json({ order, operations: await readOperations(context) });
  }

  if (action === "advance_order") {
    const orderId = cleanText(body?.orderId);
    const order = await context.db.collection<LabOrder>("labOrders").findOne({ id: orderId, labId: context.lab.id }, { projection: { _id: 0 } });
    if (!order) return NextResponse.json({ error: "Order was not found." }, { status: 404 });
    const currentIndex = stages.indexOf(order.stage);
    if (currentIndex < 0 || currentIndex === stages.length - 1) return NextResponse.json({ error: "Order is already complete." }, { status: 409 });
    const nextStage = stages[currentIndex + 1];
    await context.db.collection<LabOrder>("labOrders").updateOne({ id: order.id, labId: context.lab.id }, { $set: { stage: nextStage, updatedAt: now } });
    await context.db.collection("labOperationalAudit").insertOne({ action: "order_advanced", createdAt: now, entityId: order.id, labId: context.lab.id, note: `${order.accessionNumber} moved to ${nextStage.replace(/_/g, " ")}.`, userId: context.userId });
    return NextResponse.json({ nextStage, operations: await readOperations(context) });
  }

  if (action === "acknowledge_critical") {
    const reportId = cleanText(body?.reportId);
    const markerName = cleanText(body?.markerName);
    const report = await context.db.collection<ReportDoc>("labReports").findOne({ id: reportId, labId: context.lab.id }, { projection: { _id: 0 } });
    const marker = report?.values?.find((item) => cleanText(item.name).toLowerCase() === markerName.toLowerCase() && (item.status === "High" || item.status === "Low"));
    if (!report || !marker) return NextResponse.json({ error: "Critical result was not found." }, { status: 404 });
    await context.db.collection<CriticalAck>("criticalValueAcknowledgements").updateOne(
      { labId: context.lab.id, reportId, markerName },
      { $set: { acknowledgedAt: now, acknowledgedByUserId: context.userId, labId: context.lab.id, markerName, reportId } },
      { upsert: true },
    );
    await context.db.collection("labOperationalAudit").insertOne({ action: "critical_acknowledged", createdAt: now, entityId: reportId, labId: context.lab.id, note: `${markerName} acknowledged for ${report.clientName || "patient"}.`, userId: context.userId });
    return NextResponse.json({ operations: await readOperations(context) });
  }

  return NextResponse.json({ error: "Unsupported operation action." }, { status: 400 });
}

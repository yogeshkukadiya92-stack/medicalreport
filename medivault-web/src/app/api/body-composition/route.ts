import { NextRequest, NextResponse } from "next/server";
import { addLabAuditLog, getLabContext, requireLabPermission, userOwnsReportFile } from "@/lib/lab-server";
import { buildLabSummary, normalizePhone, statusFromValue } from "@/lib/lab-utils";
import { syncNormalizedLabReport } from "@/lib/normalized-health";
import type { LabClient, LabReport, LabReportValue, ReportMarker } from "@/lib/vault-types";

export const runtime = "nodejs";

const bodyReportFilter = {
  $or: [
    { reportType: { $regex: "body composition|\\bbmi\\b|inbody", $options: "i" } },
    { title: { $regex: "body composition|\\bbmi\\b|inbody", $options: "i" } },
  ],
};

type ValueInput = {
  name?: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  range?: string;
  status?: ReportMarker["status"];
  notes?: string;
};

function clean(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function validStatus(value: unknown): value is ReportMarker["status"] {
  return value === "Normal" || value === "High" || value === "Low" || value === "Watch";
}

function cleanValues(values: ValueInput[], labId: string, reportId: string, now: string): LabReportValue[] {
  return values.flatMap((input) => {
    const name = clean(input.name, 80);
    const value = clean(input.value, 80);
    if (!name || !value) return [];
    const referenceRange = clean(input.referenceRange || input.range, 100);
    return [{
      id: newId("value"),
      labId,
      labReportId: reportId,
      name,
      value,
      unit: clean(input.unit, 40),
      referenceRange,
      status: validStatus(input.status) ? input.status : statusFromValue(value, referenceRange),
      notes: clean(input.notes, 240) || undefined,
      createdAt: now,
      updatedAt: now,
    }];
  });
}

async function readBodyCompositionData(
  context: Exclude<Awaited<ReturnType<typeof getLabContext>>, { error: string; status: number }>,
  request: NextRequest,
) {
  const q = clean(request.nextUrl.searchParams.get("q"), 80);
  const status = clean(request.nextUrl.searchParams.get("status"), 30);
  const phone = normalizePhone(clean(request.nextUrl.searchParams.get("phone"), 30));
  const filter: Record<string, unknown> = { labId: context.lab.id, ...bodyReportFilter };
  if (status === "draft" || status === "published") filter.status = status;
  if (phone) filter.normalizedClientPhone = phone;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$and = [
      bodyReportFilter,
      { $or: [
        { clientName: { $regex: escaped, $options: "i" } },
        { clientPhone: { $regex: escaped, $options: "i" } },
        { normalizedClientPhone: { $regex: normalizePhone(q), $options: "i" } },
        { labReportId: { $regex: escaped, $options: "i" } },
      ] },
    ];
    delete filter.$or;
  }

  const reports = await context.db.collection<LabReport>("labReports")
    .find(filter, { projection: { _id: 0 } })
    .sort({ reportDate: -1, createdAt: -1 })
    .limit(300)
    .toArray();
  const clientIds = [...new Set(reports.map((report) => report.clientId).filter(Boolean))];
  const clients = clientIds.length
    ? await context.db.collection<LabClient>("labClients")
        .find({ id: { $in: clientIds }, labId: context.lab.id }, { projection: { _id: 0 } })
        .toArray()
    : [];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata" }).format(new Date());

  return {
    clients,
    lab: { id: context.lab.id, name: context.lab.name },
    metrics: {
      clients: clients.length,
      drafts: reports.filter((report) => report.status === "draft").length,
      flagged: reports.filter((report) => report.abnormal > 0).length,
      published: reports.filter((report) => report.status === "published").length,
      scansToday: reports.filter((report) => report.reportDate === today).length,
    },
    reports,
  };
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  return NextResponse.json(await readBodyCompositionData(context, request));
}

export async function POST(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Body composition data is required." }, { status: 400 });
  const action = clean(body.action, 40);
  const now = new Date().toISOString();

  if (action === "save_scan") {
    const denied = requireLabPermission(context.labUser, "reports:enter");
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
    const clientName = clean(body.clientName, 120);
    const clientPhone = clean(body.clientPhone, 30);
    const normalizedPhone = normalizePhone(clientPhone);
    if (!clientName || normalizedPhone.length < 8) {
      return NextResponse.json({ error: "Client name and valid mobile number are required." }, { status: 400 });
    }
    const fileId = clean(body.fileId, 120);
    if (fileId && !(await userOwnsReportFile(context.db, fileId, context.userId))) {
      return NextResponse.json({ error: "Uploaded source file is not available for this user." }, { status: 403 });
    }
    const reportDate = clean(body.reportDate, 20) || new Date().toISOString().slice(0, 10);
    const duplicate = await context.db.collection<LabReport>("labReports").findOne(
      { labId: context.lab.id, normalizedClientPhone: normalizedPhone, reportDate, ...bodyReportFilter },
      { projection: { _id: 0, id: 1 } },
    );
    const existingClient = await context.db.collection<LabClient>("labClients").findOne(
      { labId: context.lab.id, normalizedPhone },
      { projection: { _id: 0 } },
    );
    const client: LabClient = {
      id: existingClient?.id ?? newId("client"),
      labId: context.lab.id,
      name: clientName,
      phone: clientPhone,
      normalizedPhone,
      age: Number.isFinite(Number(body.age)) && Number(body.age) > 0 ? Number(body.age) : existingClient?.age,
      gender: clean(body.gender, 30) || existingClient?.gender,
      createdAt: existingClient?.createdAt ?? now,
      updatedAt: now,
    };
    await context.db.collection<LabClient>("labClients").updateOne(
      { labId: context.lab.id, normalizedPhone },
      { $set: client },
      { upsert: true },
    );
    const reportId = newId("body");
    const values = cleanValues(Array.isArray(body.values) ? body.values as ValueInput[] : [], context.lab.id, reportId, now);
    if (!values.length) return NextResponse.json({ error: "Enter or extract at least one body-composition value." }, { status: 400 });
    const entrySource = body.entrySource === "photo" || body.entrySource === "machine" ? body.entrySource : "manual";
    const report: LabReport = {
      id: reportId,
      labId: context.lab.id,
      labName: context.lab.name,
      labReportId: `BC-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      normalizedClientPhone: client.normalizedPhone,
      reportType: "BMI & Body Composition",
      reportDate,
      title: clean(body.title, 120) || `Body Composition - ${client.name}`,
      status: "draft",
      workflowStatus: "entered",
      values,
      abnormal: values.filter((value) => value.status !== "Normal").length,
      parameters: values.length,
      summary: clean(body.summary, 360) || buildLabSummary(values),
      entrySource,
      aiConfidence: entrySource === "photo" ? Math.max(0, Math.min(100, Number(body.aiConfidence) || 0)) : undefined,
      fileId: fileId || undefined,
      fileName: clean(body.fileName, 180) || undefined,
      fileMimeType: clean(body.fileMimeType, 100) || undefined,
      fileSizeBytes: Number.isFinite(Number(body.fileSizeBytes)) ? Number(body.fileSizeBytes) : undefined,
      createdByLabUserId: context.userId,
      duplicateOfReportId: duplicate?.id,
      createdAt: now,
      updatedAt: now,
    };
    await context.db.collection<LabReport>("labReports").insertOne(report);
    await context.db.collection<LabReportValue>("labReportValues").insertMany(values);
    await addLabAuditLog(context.db, {
      action: "create",
      actorUserId: context.userId,
      labId: context.lab.id,
      labReportId: report.id,
      note: `${entrySource} body-composition scan saved for verification.`,
    });
    return NextResponse.json({
      duplicateWarning: duplicate ? "A body-composition scan already exists for this client on the selected date." : null,
      report,
    });
  }

  if (action === "verify_publish") {
    const denied = requireLabPermission(context.labUser, "reports:verify");
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
    const reportId = clean(body.reportId, 120);
    const report = await context.db.collection<LabReport>("labReports").findOne(
      { id: reportId, labId: context.lab.id, status: "draft", ...bodyReportFilter },
      { projection: { _id: 0 } },
    );
    if (!report) return NextResponse.json({ error: "Draft body-composition scan was not found." }, { status: 404 });
    await context.db.collection<LabReport>("labReports").updateOne(
      { id: report.id, labId: context.lab.id },
      { $set: {
        status: "published",
        workflowStatus: "pathologist_verified",
        verifiedAt: now,
        verifiedByUserId: context.userId,
        publishedAt: now,
        updatedAt: now,
      } },
    );
    await context.db.collection("clientReportLinks").updateOne(
      { labReportId: report.id },
      {
        $set: { labId: context.lab.id, labReportId: report.id, normalizedPhone: report.normalizedClientPhone, state: "unclaimed", updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    const published: LabReport = {
      ...report,
      status: "published",
      workflowStatus: "pathologist_verified",
      verifiedAt: now,
      verifiedByUserId: context.userId,
      publishedAt: now,
      updatedAt: now,
    };
    let syncWarning = "";
    try {
      await syncNormalizedLabReport(context.db, published, context.userId);
    } catch (error) {
      syncWarning = error instanceof Error ? error.message : "Normalized health sync is pending.";
    }
    await addLabAuditLog(context.db, {
      action: "publish",
      actorUserId: context.userId,
      labId: context.lab.id,
      labReportId: report.id,
      note: "Body-composition scan verified and published to matching patient app.",
    });
    return NextResponse.json({
      message: syncWarning
        ? "Scan published. Normalized health sync will need a retry."
        : "Scan verified and published to patient app.",
      report: published,
      syncWarning: syncWarning || undefined,
    });
  }

  if (action === "update_draft") {
    const denied = requireLabPermission(context.labUser, "reports:enter");
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
    const reportId = clean(body.reportId, 120);
    const existing = await context.db.collection<LabReport>("labReports").findOne(
      { id: reportId, labId: context.lab.id, status: "draft", ...bodyReportFilter },
      { projection: { _id: 0 } },
    );
    if (!existing) return NextResponse.json({ error: "Draft body-composition scan was not found." }, { status: 404 });
    const values = cleanValues(Array.isArray(body.values) ? body.values as ValueInput[] : [], context.lab.id, existing.id, now);
    if (!values.length) return NextResponse.json({ error: "At least one body-composition value is required." }, { status: 400 });
    const patch = {
      values,
      parameters: values.length,
      abnormal: values.filter((value) => value.status !== "Normal").length,
      summary: clean(body.summary, 360) || buildLabSummary(values),
      updatedAt: now,
    };
    await context.db.collection<LabReportValue>("labReportValues").deleteMany({ labId: context.lab.id, labReportId: existing.id });
    await context.db.collection<LabReportValue>("labReportValues").insertMany(values);
    await context.db.collection<LabReport>("labReports").updateOne({ id: existing.id, labId: context.lab.id }, { $set: patch });
    await addLabAuditLog(context.db, {
      action: "update",
      actorUserId: context.userId,
      labId: context.lab.id,
      labReportId: existing.id,
      note: "Body-composition draft values reviewed and updated.",
    });
    return NextResponse.json({ message: "Draft values saved.", report: { ...existing, ...patch } });
  }

  return NextResponse.json({ error: "Unsupported body-composition action." }, { status: 400 });
}

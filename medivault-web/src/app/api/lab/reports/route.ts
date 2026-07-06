import { NextRequest, NextResponse } from "next/server";
import { addLabAuditLog, getLabContext } from "@/lib/lab-server";
import { getLabDashboardData, todayDate } from "@/lib/lab-dashboard";
import { buildLabSummary, normalizePhone, statusFromValue } from "@/lib/lab-utils";
import type { LabClient, LabReport, LabReportValue, ReportMarker } from "@/lib/vault-types";

export const runtime = "nodejs";

type LabReportValueInput = {
  name?: string;
  notes?: string;
  referenceRange?: string;
  status?: ReportMarker["status"];
  unit?: string;
  value?: string;
};

type LabReportInput = {
  accessionNumber?: string;
  client?: {
    age?: number | string;
    gender?: string;
    name?: string;
    phone?: string;
  };
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  doctorName?: string;
  fileId?: string;
  fileMimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  labReportId?: string;
  reportDate?: string;
  reportType?: string;
  sampleCollectedAt?: string;
  title?: string;
  values?: LabReportValueInput[];
};

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function validStatus(status: unknown): status is ReportMarker["status"] {
  return status === "Normal" || status === "High" || status === "Low" || status === "Watch";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function upsertClient(context: Exclude<Awaited<ReturnType<typeof getLabContext>>, { error: string; status: number }>, input: LabReportInput) {
  const clientName = cleanText(input.client?.name) || cleanText(input.clientName);
  const clientPhone = cleanText(input.client?.phone) || cleanText(input.clientPhone);
  const normalizedPhone = normalizePhone(clientPhone);
  const ageInput = input.client?.age;
  const parsedAge = ageInput === "" || ageInput === undefined ? undefined : Number(ageInput);
  const gender = cleanText(input.client?.gender) || undefined;

  if (!clientName) {
    return { error: "Client name is required.", status: 400 as const };
  }

  if (!normalizedPhone || normalizedPhone.length < 8) {
    return { error: "A valid client phone number is required.", status: 400 as const };
  }

  const now = new Date().toISOString();
  const existing = await context.db.collection<LabClient>("labClients").findOne(
    {
      labId: context.lab.id,
      normalizedPhone,
    },
    { projection: { _id: 0 } },
  );

  const client: LabClient = {
    id: existing?.id ?? newId("client"),
    labId: context.lab.id,
    name: clientName,
    phone: clientPhone,
    normalizedPhone,
    age: typeof parsedAge === "number" && Number.isFinite(parsedAge) ? parsedAge : existing?.age,
    gender: gender ?? existing?.gender,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await context.db.collection<LabClient>("labClients").updateOne(
    { labId: context.lab.id, normalizedPhone },
    {
      $set: client,
    },
    { upsert: true },
  );

  return { client };
}

function cleanValues(values: LabReportValueInput[], labId: string, labReportId: string, now: string): LabReportValue[] {
  return values
    .map((value) => {
      const name = cleanText(value.name);
      const resultValue = cleanText(value.value);
      const referenceRange = cleanText(value.referenceRange);
      const unit = cleanText(value.unit);
      const status = validStatus(value.status) ? value.status : statusFromValue(resultValue, referenceRange);

      return {
        id: newId("value"),
        labId,
        labReportId,
        name,
        value: resultValue,
        unit,
        referenceRange,
        status,
        notes: cleanText(value.notes) || undefined,
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter((value) => value.name && value.value);
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() || "";
  const reportType = params.get("reportType")?.trim() || "";
  const status = params.get("status")?.trim() || "";
  const sync = params.get("sync")?.trim() || "";
  const staff = params.get("staff")?.trim() || "";
  const from = params.get("from")?.trim() || "";
  const to = params.get("to")?.trim() || "";
  const filter: Record<string, unknown> = { labId: context.lab.id };

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { clientName: { $regex: escaped, $options: "i" } },
      { clientPhone: { $regex: escaped, $options: "i" } },
      { normalizedClientPhone: { $regex: normalizePhone(q), $options: "i" } },
      { title: { $regex: escaped, $options: "i" } },
      { labReportId: { $regex: escaped, $options: "i" } },
      { accessionNumber: { $regex: escaped, $options: "i" } },
    ];
  }
  if (reportType) filter.reportType = reportType;
  if (status) filter.status = status;
  if (staff) filter.createdByLabUserId = staff;
  if (sync === "claimed" || sync === "unclaimed") {
    const links = await context.db
      .collection("clientReportLinks")
      .find({ labId: context.lab.id, state: sync }, { projection: { _id: 0, labReportId: 1 } })
      .toArray();
    filter.id = { $in: links.map((link) => link.labReportId) };
  }
  if (from || to) {
    filter.reportDate = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };
  }

  const reports = await context.db
    .collection<LabReport>("labReports")
    .find(filter, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(250)
    .toArray();

  const dashboard = await getLabDashboardData(context.db, context.lab);

  return NextResponse.json({
    ...dashboard,
    lab: context.lab,
    reports,
  });
}

export async function POST(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => null)) as LabReportInput | null;
  if (!body) {
    return NextResponse.json({ error: "Report data is required." }, { status: 400 });
  }

  const clientResult = await upsertClient(context, body);
  if ("error" in clientResult) {
    return NextResponse.json({ error: clientResult.error }, { status: clientResult.status });
  }

  const reportType = cleanText(body.reportType);
  const reportDate = cleanText(body.reportDate) || todayDate();

  if (!reportType) {
    return NextResponse.json({ error: "Report type is required." }, { status: 400 });
  }

  const duplicate = await context.db.collection<LabReport>("labReports").findOne(
    {
      labId: context.lab.id,
      normalizedClientPhone: clientResult.client.normalizedPhone,
      reportDate,
      reportType,
    },
    { projection: { _id: 0 } },
  );

  const now = new Date().toISOString();
  const reportId = newId("report");
  const values = cleanValues(body.values ?? [], context.lab.id, reportId, now);
  const abnormal = values.filter((value) => value.status !== "Normal").length;
  const labReportId = cleanText(body.labReportId) || cleanText(body.accessionNumber) || `LR-${Date.now()}`;
  const report: LabReport = {
    id: reportId,
    labId: context.lab.id,
    labName: context.lab.name,
    labReportId,
    clientId: clientResult.client.id,
    clientName: clientResult.client.name,
    clientPhone: clientResult.client.phone,
    normalizedClientPhone: clientResult.client.normalizedPhone,
    reportType,
    reportDate,
    title: cleanText(body.title) || `${reportType} - ${clientResult.client.name}`,
    status: "published",
    values,
    abnormal,
    parameters: values.length,
    summary: buildLabSummary(values),
    fileId: cleanText(body.fileId) || undefined,
    fileName: cleanText(body.fileName) || undefined,
    fileMimeType: cleanText(body.fileMimeType) || undefined,
    fileSizeBytes: typeof body.fileSizeBytes === "number" && Number.isFinite(body.fileSizeBytes) ? body.fileSizeBytes : undefined,
    createdByLabUserId: context.userId,
    doctorName: cleanText(body.doctorName) || undefined,
    accessionNumber: cleanText(body.accessionNumber) || undefined,
    sampleCollectedAt: cleanText(body.sampleCollectedAt) || undefined,
    duplicateOfReportId: duplicate?.id,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await context.db.collection<LabReport>("labReports").insertOne(report);
  if (values.length) {
    await context.db.collection<LabReportValue>("labReportValues").insertMany(values);
  }
  await context.db.collection("clientReportLinks").updateOne(
    { labReportId: report.id },
    {
      $set: {
        labId: context.lab.id,
        labReportId: report.id,
        normalizedPhone: report.normalizedClientPhone,
        state: "unclaimed",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );
  await addLabAuditLog(context.db, {
    action: "create",
    actorUserId: context.userId,
    labId: context.lab.id,
    labReportId: report.id,
    note: "Structured lab report created.",
  });
  await addLabAuditLog(context.db, {
    action: "publish",
    actorUserId: context.userId,
    labId: context.lab.id,
    labReportId: report.id,
    note: "Report auto-published to matching client vaults.",
  });

  return NextResponse.json({
    duplicateWarning: duplicate
      ? `A ${reportType} report already exists for ${clientResult.client.name} on ${reportDate}.`
      : null,
    report,
  });
}

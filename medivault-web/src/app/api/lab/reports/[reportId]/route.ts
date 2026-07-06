import { NextRequest, NextResponse } from "next/server";
import { addLabAuditLog, getLabContext } from "@/lib/lab-server";
import { buildLabSummary, normalizePhone, statusFromValue } from "@/lib/lab-utils";
import type { LabReport, LabReportValue, ReportMarker } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    reportId: string;
  };
};

type LabReportValueInput = {
  name?: string;
  notes?: string;
  referenceRange?: string;
  status?: ReportMarker["status"];
  unit?: string;
  value?: string;
};

type PatchInput = {
  accessionNumber?: string;
  clientName?: string;
  clientPhone?: string;
  doctorName?: string;
  fileId?: string;
  fileMimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  reportDate?: string;
  reportType?: string;
  sampleCollectedAt?: string;
  title?: string;
  values?: LabReportValueInput[];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validStatus(status: unknown): status is ReportMarker["status"] {
  return status === "Normal" || status === "High" || status === "Low" || status === "Watch";
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanValues(values: LabReportValueInput[], labId: string, labReportId: string, now: string): LabReportValue[] {
  return values
    .map((value) => {
      const name = cleanText(value.name);
      const resultValue = cleanText(value.value);
      const referenceRange = cleanText(value.referenceRange);
      const unit = cleanText(value.unit);
      return {
        id: newId("value"),
        labId,
        labReportId,
        name,
        value: resultValue,
        unit,
        referenceRange,
        status: validStatus(value.status) ? value.status : statusFromValue(resultValue, referenceRange),
        notes: cleanText(value.notes) || undefined,
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter((value) => value.name && value.value);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const existing = await context.db.collection<LabReport>("labReports").findOne(
    {
      id: params.reportId,
      labId: context.lab.id,
    },
    { projection: { _id: 0 } },
  );

  if (!existing) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as PatchInput | null;
  if (!body) {
    return NextResponse.json({ error: "Report changes are required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Partial<LabReport> = {
    updatedAt: now,
  };

  const textFields: Array<keyof Pick<LabReport, "accessionNumber" | "doctorName" | "fileId" | "fileMimeType" | "fileName" | "reportDate" | "reportType" | "sampleCollectedAt" | "title">> = [
    "accessionNumber",
    "doctorName",
    "fileId",
    "fileMimeType",
    "fileName",
    "reportDate",
    "reportType",
    "sampleCollectedAt",
    "title",
  ];

  textFields.forEach((field) => {
    const value = cleanText(body[field]);
    if (value) {
      patch[field] = value as never;
    }
  });

  if (typeof body.fileSizeBytes === "number" && Number.isFinite(body.fileSizeBytes)) {
    patch.fileSizeBytes = body.fileSizeBytes;
  }

  const clientName = cleanText(body.clientName);
  const clientPhone = cleanText(body.clientPhone);
  if (clientName) patch.clientName = clientName;
  if (clientPhone) {
    const normalizedPhone = normalizePhone(clientPhone);
    if (normalizedPhone.length < 8) {
      return NextResponse.json({ error: "A valid client phone number is required." }, { status: 400 });
    }
    patch.clientPhone = clientPhone;
    patch.normalizedClientPhone = normalizedPhone;
  }

  if (Array.isArray(body.values)) {
    const values = cleanValues(body.values, context.lab.id, existing.id, now);
    patch.values = values;
    patch.parameters = values.length;
    patch.abnormal = values.filter((value) => value.status !== "Normal").length;
    patch.summary = buildLabSummary(values);

    await context.db.collection<LabReportValue>("labReportValues").deleteMany({
      labId: context.lab.id,
      labReportId: existing.id,
    });
    if (values.length) {
      await context.db.collection<LabReportValue>("labReportValues").insertMany(values);
    }
  }

  await context.db.collection<LabReport>("labReports").updateOne(
    {
      id: existing.id,
      labId: context.lab.id,
    },
    {
      $set: patch,
    },
  );

  const report = await context.db.collection<LabReport>("labReports").findOne(
    {
      id: existing.id,
      labId: context.lab.id,
    },
    { projection: { _id: 0 } },
  );

  await addLabAuditLog(context.db, {
    action: "update",
    actorUserId: context.userId,
    labId: context.lab.id,
    labReportId: existing.id,
    note: "Lab report updated.",
  });

  return NextResponse.json({ report });
}

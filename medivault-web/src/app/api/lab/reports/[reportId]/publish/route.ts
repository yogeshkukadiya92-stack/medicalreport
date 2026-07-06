import { NextRequest, NextResponse } from "next/server";
import { addLabAuditLog, getLabContext } from "@/lib/lab-server";
import type { LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    reportId: string;
  };
};

export async function POST(request: NextRequest, { params }: RouteParams) {
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

  const now = new Date().toISOString();
  await context.db.collection<LabReport>("labReports").updateOne(
    {
      id: existing.id,
      labId: context.lab.id,
    },
    {
      $set: {
        publishedAt: existing.publishedAt ?? now,
        status: "published",
        updatedAt: now,
      },
    },
  );

  await context.db.collection("clientReportLinks").updateOne(
    { labReportId: existing.id },
    {
      $set: {
        labId: context.lab.id,
        labReportId: existing.id,
        normalizedPhone: existing.normalizedClientPhone,
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
    action: "publish",
    actorUserId: context.userId,
    labId: context.lab.id,
    labReportId: existing.id,
    note: "Lab report published.",
  });

  const report = await context.db.collection<LabReport>("labReports").findOne(
    {
      id: existing.id,
      labId: context.lab.id,
    },
    { projection: { _id: 0 } },
  );

  return NextResponse.json({ report });
}

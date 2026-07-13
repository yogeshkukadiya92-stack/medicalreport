import { NextRequest, NextResponse } from "next/server";
import { addLabAuditLog, getLabContext } from "@/lib/lab-server";
import { syncNormalizedLabReport } from "@/lib/normalized-health";
import type { LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { reportId } = await params;
    const context = await getLabContext(request);
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const existing = await context.db.collection<LabReport>("labReports").findOne(
      {
        id: reportId,
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
      action: existing.status === "published" ? "update" : "publish",
      actorUserId: context.userId,
      labId: context.lab.id,
      labReportId: existing.id,
      note: existing.status === "published" ? "Lab report synced to patient app link." : "Lab report published.",
    });

    const report = await context.db.collection<LabReport>("labReports").findOne(
      {
        id: existing.id,
        labId: context.lab.id,
      },
      { projection: { _id: 0 } },
    );
    let syncWarning = "";
    if (report) {
      try {
        await syncNormalizedLabReport(context.db, report, context.userId);
      } catch (syncError) {
        syncWarning = syncError instanceof Error ? syncError.message : "FHIR sync could not finish.";
      }
    }

    return NextResponse.json({ report, syncWarning });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report could not be published." },
      { status: 500 },
    );
  }
}

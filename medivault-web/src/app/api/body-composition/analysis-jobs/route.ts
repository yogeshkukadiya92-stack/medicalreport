import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureBodyAnalysisJobIndexes, isLocalAnalysisWorkerEnabled, publicBodyAnalysisJob, type BodyAnalysisJob } from "@/lib/body-analysis-jobs";
import { getLabContext, requireLabPermission, userOwnsReportFile } from "@/lib/lab-server";

export const runtime = "nodejs";
export const maxDuration = 30;

const maxPayloadCharacters = 12_000_000;

function clean(value: unknown, maxLength = 180) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  if (!isLocalAnalysisWorkerEnabled()) {
    return NextResponse.json({ error: "Local analysis worker is not enabled.", workerEnabled: false }, { status: 503 });
  }
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const denied = requireLabPermission(context.labUser, "reports:enter");
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const body = await request.json().catch(() => null) as {
    fileId?: string;
    fileName?: string;
    imageDataUrls?: string[];
    lab?: string;
    memberName?: string;
    title?: string;
  } | null;
  const imageDataUrls = Array.isArray(body?.imageDataUrls)
    ? body.imageDataUrls
        .filter((value) => typeof value === "string" && /^data:image\/(jpeg|png|webp);base64,/i.test(value))
        .slice(0, 3)
    : [];
  const totalSize = imageDataUrls.reduce((sum, value) => sum + value.length, 0);
  if (!imageDataUrls.length || totalSize > maxPayloadCharacters) {
    return NextResponse.json({ error: "Prepared report pages are missing or too large for local analysis." }, { status: 400 });
  }
  const fileId = clean(body?.fileId, 120);
  if (fileId && !(await userOwnsReportFile(context.db, fileId, context.userId))) {
    return NextResponse.json({ error: "Uploaded source file is not available for this user." }, { status: 403 });
  }

  const now = new Date();
  const job: BodyAnalysisJob = {
    id: `body-job-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
    attempts: 0,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    fileId: fileId || undefined,
    fileName: clean(body?.fileName, 180) || undefined,
    imageDataUrls,
    lab: clean(body?.lab, 100) || context.lab.name,
    labId: context.lab.id,
    memberName: clean(body?.memberName, 120) || "Client",
    status: "queued",
    title: clean(body?.title, 120) || "BMI & Body Composition",
    updatedAt: now.toISOString(),
    userId: context.userId,
  };
  const collection = await ensureBodyAnalysisJobIndexes(context.db);
  await collection.insertOne(job);
  return NextResponse.json({ job: publicBodyAnalysisJob(job), workerEnabled: true }, { status: 202 });
}

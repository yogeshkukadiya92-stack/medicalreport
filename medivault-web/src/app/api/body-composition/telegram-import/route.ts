import crypto from "node:crypto";
import { GridFSBucket } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ensureBodyAnalysisJobIndexes, isLocalAnalysisWorkerEnabled, type BodyAnalysisJob } from "@/lib/body-analysis-jobs";
import { getAutomationLabContext } from "@/lib/lab-server";
import { normalizePhone } from "@/lib/lab-utils";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";
export const maxDuration = 45;

const maxFileSize = 12 * 1024 * 1024;

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function tokenMatches(value: string) {
  const expected = process.env.N8N_IMPORT_TOKEN || "";
  if (!expected || !value) return false;
  const left = crypto.createHash("sha256").update(expected).digest();
  const right = crypto.createHash("sha256").update(value).digest();
  return crypto.timingSafeEqual(left, right);
}

function detectImageMime(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return "";
}

function uploadFile(bucket: GridFSBucket, file: File, buffer: Buffer, userId: string, contentType: string) {
  return new Promise<string>((resolve, reject) => {
    const stream = bucket.openUploadStream(file.name || "telegram-inbody-report", {
      contentType,
      metadata: { originalName: file.name, source: "telegram", uploadedAt: new Date(), userId },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id.toString()));
    stream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  if (!tokenMatches(bearer)) return NextResponse.json({ error: "Import authorization failed." }, { status: 401 });
  if (!isMongoConfigured() || !isLocalAnalysisWorkerEnabled()) {
    return NextResponse.json({ error: "Import storage or local analysis is not configured." }, { status: 503 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Telegram attachment is required." }, { status: 400 });
  if (file.size > maxFileSize) return NextResponse.json({ error: "Attachment exceeds 12 MB." }, { status: 413 });
  const sourceId = clean(form?.get("sourceId") ?? null, 160);
  const clientName = clean(form?.get("clientName") ?? null, 120);
  const clientPhone = clean(form?.get("clientPhone") ?? null, 30);
  const normalizedPhone = normalizePhone(clientPhone);
  if (!sourceId || !clientName || normalizedPhone.length < 8) {
    return NextResponse.json({ error: "sourceId, clientName and valid clientPhone are required." }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectImageMime(buffer);
  if (!mime) {
    return NextResponse.json({ error: "Send the InBody report as a JPG, PNG or WEBP photo. PDF conversion is not enabled for Telegram yet." }, { status: 415 });
  }

  const db = await getMongoDb();
  await db.collection("telegramBodyImports").createIndex({ sourceId: 1 }, { unique: true });
  const existing = await db.collection("telegramBodyImports").findOne({ sourceId });
  if (existing) {
    return NextResponse.json({ duplicate: true, jobId: existing.jobId, reportId: existing.reportId }, { status: 200 });
  }
  const email = (process.env.N8N_IMPORT_USER_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
  const user = await db.collection("authUsers").findOne({ email }, { projection: { _id: 0, id: 1 } });
  if (!user?.id) return NextResponse.json({ error: "Automation owner account was not found." }, { status: 503 });
  const context = await getAutomationLabContext(db, user.id);
  if (!context) return NextResponse.json({ error: "Automation owner has no lab access." }, { status: 503 });

  const fileId = await uploadFile(new GridFSBucket(db, { bucketName: "reportFiles" }), file, buffer, user.id, mime);
  const now = new Date();
  const reportDate = clean(form?.get("reportDate") ?? null, 20) || now.toISOString().slice(0, 10);
  const job: BodyAnalysisJob = {
    id: `body-job-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
    attempts: 0,
    automation: { clientName, clientPhone, reportDate, source: "telegram", sourceId },
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    fileId,
    fileName: file.name || "telegram-inbody-report",
    imageDataUrls: [`data:${mime};base64,${buffer.toString("base64")}`],
    lab: context.lab.name,
    labId: context.lab.id,
    memberName: clientName,
    status: "queued",
    title: `Body Composition - ${clientName}`,
    updatedAt: now.toISOString(),
    userId: user.id,
  };
  await (await ensureBodyAnalysisJobIndexes(db)).insertOne(job);
  await db.collection("telegramBodyImports").insertOne({
    createdAt: now.toISOString(),
    jobId: job.id,
    sourceId,
    status: "queued",
    updatedAt: now.toISOString(),
  });
  return NextResponse.json({ accepted: true, jobId: job.id, status: job.status }, { status: 202 });
}

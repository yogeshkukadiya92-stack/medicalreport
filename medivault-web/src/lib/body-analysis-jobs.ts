import crypto from "node:crypto";
import type { Db } from "mongodb";
import type { ReportMarker } from "@/lib/vault-types";

export type BodyAnalysisResult = {
  aiConfidence: number;
  category: string;
  markers: ReportMarker[];
  summary: string;
  title: string;
};

export type BodyAnalysisJob = {
  id: string;
  labId: string;
  userId: string;
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: Date;
  imageDataUrls?: string[];
  fileId?: string;
  fileName?: string;
  lab?: string;
  memberName?: string;
  title?: string;
  leaseToken?: string;
  leaseUntil?: string;
  error?: string;
  result?: BodyAnalysisResult;
};

const collectionName = "bodyAnalysisJobs";
const maxAttempts = 3;
const leaseDurationMs = 15 * 60 * 1000;

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

export function isLocalAnalysisWorkerEnabled() {
  return process.env.LOCAL_ANALYSIS_WORKER_ENABLED === "true" && Boolean(process.env.LOCAL_ANALYSIS_WORKER_TOKEN);
}

export function isValidWorkerToken(value: string) {
  const expected = process.env.LOCAL_ANALYSIS_WORKER_TOKEN || "";
  if (!expected || !value) return false;
  return crypto.timingSafeEqual(hash(expected), hash(value));
}

export async function ensureBodyAnalysisJobIndexes(db: Db) {
  const collection = db.collection<BodyAnalysisJob>(collectionName);
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true }),
    collection.createIndex({ status: 1, createdAt: 1 }),
    collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return collection;
}

export async function claimBodyAnalysisJob(db: Db) {
  const collection = await ensureBodyAnalysisJobIndexes(db);
  const now = new Date();
  const nowIso = now.toISOString();
  const leaseToken = crypto.randomBytes(24).toString("base64url");
  return collection.findOneAndUpdate(
    {
      attempts: { $lt: maxAttempts },
      $or: [
        { status: "queued" },
        { status: "processing", leaseUntil: { $lt: nowIso } },
      ],
    },
    {
      $inc: { attempts: 1 },
      $set: {
        leaseToken,
        leaseUntil: new Date(now.getTime() + leaseDurationMs).toISOString(),
        status: "processing",
        updatedAt: nowIso,
      },
      $unset: { error: "" },
    },
    {
      includeResultMetadata: false,
      returnDocument: "after",
      sort: { createdAt: 1 },
    },
  );
}

export async function completeBodyAnalysisJob(
  db: Db,
  input: { id: string; leaseToken: string; result: BodyAnalysisResult },
) {
  const collection = await ensureBodyAnalysisJobIndexes(db);
  return collection.findOneAndUpdate(
    { id: input.id, leaseToken: input.leaseToken, status: "processing" },
    {
      $set: {
        result: input.result,
        status: "completed",
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        error: "",
        imageDataUrls: "",
        leaseToken: "",
        leaseUntil: "",
      },
    },
    { includeResultMetadata: false, returnDocument: "after" },
  );
}

export async function failBodyAnalysisJob(
  db: Db,
  input: { error: string; id: string; leaseToken: string },
) {
  const collection = await ensureBodyAnalysisJobIndexes(db);
  const existing = await collection.findOne(
    { id: input.id, leaseToken: input.leaseToken, status: "processing" },
    { projection: { _id: 0, attempts: 1 } },
  );
  if (!existing) return null;
  const terminal = existing.attempts >= maxAttempts;
  return collection.findOneAndUpdate(
    { id: input.id, leaseToken: input.leaseToken, status: "processing" },
    {
      $set: {
        error: input.error.slice(0, 300),
        status: terminal ? "failed" : "queued",
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        leaseToken: "",
        leaseUntil: "",
        ...(terminal ? { imageDataUrls: "" } : {}),
      },
    },
    { includeResultMetadata: false, returnDocument: "after" },
  );
}

export function publicBodyAnalysisJob(job: BodyAnalysisJob) {
  return {
    attempts: job.attempts,
    error: job.error,
    id: job.id,
    result: job.result,
    status: job.status,
    updatedAt: job.updatedAt,
  };
}

import { GridFSBucket } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 45;

const maxFileSizeBytes = 20 * 1024 * 1024;
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function detectMimeType(buffer: Buffer) {
  if (buffer.subarray(0, 4).equals(Buffer.from("%PDF"))) return "application/pdf";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return "";
}

function uploadBuffer(bucket: GridFSBucket, file: File, buffer: Buffer, userId: string, contentType: string) {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.name || "medical-report", {
      contentType,
      metadata: {
        originalName: file.name || "medical-report",
        uploadedAt: new Date(),
        userId,
      },
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id.toString()));
    uploadStream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(clientKey(request, "file-upload"), { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
  }

  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to store files." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is not configured for file storage." }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  if (file.size > maxFileSizeBytes) {
    return NextResponse.json({ error: "File is larger than 20 MB. Compress it or upload a smaller report." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMimeType = detectMimeType(buffer);
  if (!detectedMimeType || !allowedMimeTypes.has(detectedMimeType)) {
    return NextResponse.json({ error: "Only valid PDF, JPG, PNG or WEBP report files are allowed." }, { status: 415 });
  }

  if (file.type && file.type !== detectedMimeType) {
    return NextResponse.json({ error: "Uploaded file type does not match the file contents." }, { status: 415 });
  }

  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
  const fileId = await uploadBuffer(bucket, file, buffer, userId, detectedMimeType);

  return NextResponse.json({
    fileId,
    fileMimeType: detectedMimeType,
    fileName: file.name,
    fileSizeBytes: file.size,
  });
}

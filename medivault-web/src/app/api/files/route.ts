import { GridFSBucket } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";
export const maxDuration = 45;

const maxFileSizeBytes = 20 * 1024 * 1024;

function uploadBuffer(bucket: GridFSBucket, file: File, buffer: Buffer, userId: string) {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(file.name || "medical-report", {
      contentType: file.type || "application/octet-stream",
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

  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = await uploadBuffer(bucket, file, buffer, userId);

  return NextResponse.json({
    fileId,
    fileMimeType: file.type || "application/octet-stream",
    fileName: file.name,
    fileSizeBytes: file.size,
  });
}

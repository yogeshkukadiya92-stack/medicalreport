import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    fileId: string;
  };
};

async function findOwnedFile(bucket: GridFSBucket, fileId: ObjectId, userId: string) {
  return bucket.find({ _id: fileId, "metadata.userId": userId }).next();
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to view files." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is not configured for file storage." }, { status: 503 });
  }

  if (!ObjectId.isValid(params.fileId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
  const fileId = new ObjectId(params.fileId);
  const file = await findOwnedFile(bucket, fileId, userId);

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const stream = bucket.openDownloadStream(fileId);
  const webStream = Readable.toWeb(stream) as ReadableStream;
  const filename = encodeURIComponent(file.filename || "medical-report");

  return new NextResponse(webStream, {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Type": file.contentType || "application/octet-stream",
    },
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to delete files." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ deleted: false });
  }

  if (!ObjectId.isValid(params.fileId)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
  const fileId = new ObjectId(params.fileId);
  const file = await findOwnedFile(bucket, fileId, userId);

  if (file) {
    await bucket.delete(fileId);
  }

  return NextResponse.json({ deleted: true });
}

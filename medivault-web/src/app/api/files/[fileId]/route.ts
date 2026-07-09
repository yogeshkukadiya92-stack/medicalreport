import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { phoneMatchKeys } from "@/lib/lab-utils";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { LabReport, LabUser, VaultSnapshot } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    fileId: string;
  }>;
};

async function findOwnedFile(bucket: GridFSBucket, fileId: ObjectId, userId: string) {
  return bucket.find({ _id: fileId, "metadata.userId": userId }).next();
}

async function canViewLabFile(fileId: string, userId: string) {
  const db = await getMongoDb();
  const labUser = await db.collection<LabUser>("labUsers").findOne({ userId }, { projection: { _id: 0 } });

  if (labUser) {
    const labReport = await db.collection<LabReport>("labReports").findOne(
      {
        fileId,
        labId: labUser.labId,
      },
      { projection: { _id: 0, id: 1 } },
    );
    if (labReport) return true;
  }

  const vault = await db.collection("vaults").findOne<{ snapshot?: VaultSnapshot }>({ userId });
  const phones = [
    ...new Set(
      (vault?.snapshot?.familyMembers ?? [])
        .flatMap((member) => phoneMatchKeys(member.phone ?? "", member.countryCode))
        .filter((phone) => phone.length >= 8),
    ),
  ];

  if (!phones.length) return false;

  const report = await db.collection<LabReport>("labReports").findOne(
    {
      fileId,
      normalizedClientPhone: { $in: phones },
      status: "published",
    },
    { projection: { _id: 0, id: 1 } },
  );

  return Boolean(report);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { fileId: fileIdParam } = await params;
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to view files." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is not configured for file storage." }, { status: 503 });
  }

  if (!ObjectId.isValid(fileIdParam)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
  const fileId = new ObjectId(fileIdParam);
  let file = await findOwnedFile(bucket, fileId, userId);

  if (!file && (await canViewLabFile(fileIdParam, userId))) {
    file = await bucket.find({ _id: fileId }).next();
  }

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
  const { fileId: fileIdParam } = await params;
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to delete files." }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ deleted: false });
  }

  if (!ObjectId.isValid(fileIdParam)) {
    return NextResponse.json({ error: "Invalid file id." }, { status: 400 });
  }

  const db = await getMongoDb();
  const bucket = new GridFSBucket(db, { bucketName: "reportFiles" });
  const fileId = new ObjectId(fileIdParam);
  const file = await findOwnedFile(bucket, fileId, userId);

  if (file) {
    await bucket.delete(fileId);
  }

  return NextResponse.json({ deleted: true });
}

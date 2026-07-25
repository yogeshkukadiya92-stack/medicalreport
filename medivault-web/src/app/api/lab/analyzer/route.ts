import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";

export const runtime = "nodejs";

type AnalyzerMapping = {
  id: string;
  labId: string;
  analyzerName: string;
  testCode: string;
  testName: string;
  unit?: string;
  referenceRange?: string;
  createdAt: string;
  updatedAt: string;
};

type AnalyzerBatch = {
  id: string;
  labId: string;
  fileName: string;
  analyzerName: string;
  groupCount: number;
  resultCount: number;
  publishedCount: number;
  failedCount: number;
  status: "review" | "partial" | "published";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

function clean(value: unknown, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeCode(value: string) {
  return value.toUpperCase().replace(/[\s/-]+/g, "_");
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const [mappings, batches] = await Promise.all([
    context.db
      .collection<AnalyzerMapping>("analyzerMappings")
      .find({ labId: context.lab.id }, { projection: { _id: 0 } })
      .sort({ analyzerName: 1, testCode: 1 })
      .limit(500)
      .toArray(),
    context.db
      .collection<AnalyzerBatch>("analyzerImportBatches")
      .find({ labId: context.lab.id }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray(),
  ]);

  return NextResponse.json({ mappings, batches });
}

export async function POST(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Request data is required." }, { status: 400 });

  const action = clean(body.action, 40);
  const now = new Date().toISOString();

  if (action === "save_mapping") {
    const analyzerName = clean(body.analyzerName, 80) || "Default analyzer";
    const testCode = normalizeCode(clean(body.testCode, 50));
    const testName = clean(body.testName, 120);
    if (!testCode || !testName) {
      return NextResponse.json({ error: "Test code and MediVault parameter are required." }, { status: 400 });
    }
    const existing = await context.db.collection<AnalyzerMapping>("analyzerMappings").findOne(
      { labId: context.lab.id, analyzerName, testCode },
      { projection: { _id: 0 } },
    );
    const mapping: AnalyzerMapping = {
      id: existing?.id ?? `mapping-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      labId: context.lab.id,
      analyzerName,
      testCode,
      testName,
      unit: clean(body.unit, 40) || undefined,
      referenceRange: clean(body.referenceRange, 80) || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await context.db.collection<AnalyzerMapping>("analyzerMappings").updateOne(
      { labId: context.lab.id, analyzerName, testCode },
      { $set: mapping },
      { upsert: true },
    );
    return NextResponse.json({ mapping });
  }

  if (action === "delete_mapping") {
    const id = clean(body.id, 100);
    if (!id) return NextResponse.json({ error: "Mapping ID is required." }, { status: 400 });
    await context.db.collection<AnalyzerMapping>("analyzerMappings").deleteOne({ id, labId: context.lab.id });
    return NextResponse.json({ deleted: true });
  }

  if (action === "save_batch") {
    const fileName = clean(body.fileName, 180);
    const resultCount = Math.max(0, Math.min(10000, Number(body.resultCount) || 0));
    const groupCount = Math.max(0, Math.min(1000, Number(body.groupCount) || 0));
    if (!fileName || !resultCount || !groupCount) {
      return NextResponse.json({ error: "A valid analyzer batch is required." }, { status: 400 });
    }
    const batch: AnalyzerBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      labId: context.lab.id,
      fileName,
      analyzerName: clean(body.analyzerName, 80) || "Default analyzer",
      groupCount,
      resultCount,
      publishedCount: 0,
      failedCount: 0,
      status: "review",
      createdByUserId: context.userId,
      createdAt: now,
      updatedAt: now,
    };
    await context.db.collection<AnalyzerBatch>("analyzerImportBatches").insertOne(batch);
    return NextResponse.json({ batch });
  }

  if (action === "complete_batch") {
    const id = clean(body.id, 100);
    const publishedCount = Math.max(0, Math.min(1000, Number(body.publishedCount) || 0));
    const failedCount = Math.max(0, Math.min(1000, Number(body.failedCount) || 0));
    if (!id) return NextResponse.json({ error: "Batch ID is required." }, { status: 400 });
    const status: AnalyzerBatch["status"] = failedCount ? "partial" : "published";
    await context.db.collection<AnalyzerBatch>("analyzerImportBatches").updateOne(
      { id, labId: context.lab.id },
      { $set: { publishedCount, failedCount, status, updatedAt: now } },
    );
    return NextResponse.json({ updated: true });
  }

  return NextResponse.json({ error: "Unsupported analyzer action." }, { status: 400 });
}

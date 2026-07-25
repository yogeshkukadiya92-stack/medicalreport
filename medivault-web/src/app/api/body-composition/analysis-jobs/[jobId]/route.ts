import { NextRequest, NextResponse } from "next/server";
import { ensureBodyAnalysisJobIndexes, publicBodyAnalysisJob } from "@/lib/body-analysis-jobs";
import { getLabContext } from "@/lib/lab-server";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ jobId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const { jobId } = await params;
  const collection = await ensureBodyAnalysisJobIndexes(context.db);
  const job = await collection.findOne(
    { id: jobId.slice(0, 120), labId: context.lab.id, userId: context.userId },
    { projection: { _id: 0, imageDataUrls: 0, leaseToken: 0 } },
  );
  if (!job) return NextResponse.json({ error: "Analysis job was not found." }, { status: 404 });
  return NextResponse.json({ job: publicBodyAnalysisJob(job) });
}

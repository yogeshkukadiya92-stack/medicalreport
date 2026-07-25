import { NextRequest, NextResponse } from "next/server";
import {
  claimBodyAnalysisJob,
  completeBodyAnalysisJob,
  failBodyAnalysisJob,
  isLocalAnalysisWorkerEnabled,
  isValidWorkerToken,
  type BodyAnalysisResult,
} from "@/lib/body-analysis-jobs";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { saveAutomatedBodyCompositionReport } from "@/lib/body-composition-automation";
import type { ReportMarker } from "@/lib/vault-types";

export const runtime = "nodejs";
export const maxDuration = 30;

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanStatus(value: unknown): ReportMarker["status"] {
  return value === "Normal" || value === "High" || value === "Low" ? value : "Watch";
}

function cleanResult(value: unknown): BodyAnalysisResult | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const markers = Array.isArray(input.markers)
    ? input.markers.slice(0, 48).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const marker = item as Record<string, unknown>;
        const name = clean(marker.name, 80);
        const markerValue = clean(marker.value, 80);
        if (!name || !markerValue) return [];
        return [{
          name,
          range: clean(marker.range, 100) || "Not provided",
          status: cleanStatus(marker.status),
          value: markerValue,
        }];
      })
    : [];
  if (!markers.length) return null;
  return {
    aiConfidence: Math.max(0, Math.min(100, Number(input.aiConfidence) || 86)),
    category: clean(input.category, 40) || "Body Composition",
    markers,
    summary: clean(input.summary, 280) || "Body composition values extracted for professional verification.",
    title: clean(input.title, 80) || "BMI & Body Composition",
  };
}

export async function POST(request: NextRequest) {
  if (!isLocalAnalysisWorkerEnabled() || !isValidWorkerToken(bearerToken(request))) {
    return NextResponse.json({ error: "Worker authorization failed." }, { status: 401 });
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = clean(body?.action, 30);
  const db = await getMongoDb();

  if (action === "claim") {
    const job = await claimBodyAnalysisJob(db);
    if (!job) return new NextResponse(null, { status: 204 });
    return NextResponse.json({
      job: {
        fileName: job.fileName,
        id: job.id,
        imageDataUrls: job.imageDataUrls,
        lab: job.lab,
        leaseToken: job.leaseToken,
        memberName: job.memberName,
        title: job.title,
      },
    });
  }

  if (action === "complete") {
    const result = cleanResult(body?.result);
    const id = clean(body?.id, 120);
    const leaseToken = clean(body?.leaseToken, 120);
    if (!id || !leaseToken || !result) {
      return NextResponse.json({ error: "A valid job result is required." }, { status: 400 });
    }
    const completed = await completeBodyAnalysisJob(db, { id, leaseToken, result });
    if (!completed) return NextResponse.json({ error: "Job lease is no longer valid." }, { status: 409 });
    const report = await saveAutomatedBodyCompositionReport(db, completed);
    return NextResponse.json({ completed: true, reportId: report?.id });
  }

  if (action === "fail") {
    const id = clean(body?.id, 120);
    const leaseToken = clean(body?.leaseToken, 120);
    if (!id || !leaseToken) return NextResponse.json({ error: "Job identity is required." }, { status: 400 });
    const failed = await failBodyAnalysisJob(db, {
      error: clean(body?.error, 300) || "Local analysis failed.",
      id,
      leaseToken,
    });
    if (!failed) return NextResponse.json({ error: "Job lease is no longer valid." }, { status: 409 });
    return NextResponse.json({ failed: true, status: failed.status });
  }

  return NextResponse.json({ error: "Unsupported worker action." }, { status: 400 });
}

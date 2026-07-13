import { NextRequest, NextResponse } from "next/server";
import type { AdminReportsPayload } from "@/lib/admin-types";
import { enrichAdminReports, escapeSearch, getAdminContext, normalizeAdminPhone } from "@/lib/admin-server";
import type { LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export async function GET(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() || "";
  const status = params.get("status") || "";
  const risk = params.get("risk") || "";
  const sync = params.get("sync") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const page = positiveInteger(params.get("page"), 1, 10_000);
  const pageSize = positiveInteger(params.get("pageSize"), 25, 100);
  const filter: Record<string, unknown> = { labId: context.lab.id };
  const andFilters: Record<string, unknown>[] = [];

  if (q) {
    const escaped = escapeSearch(q);
    const phone = normalizeAdminPhone(q);
    andFilters.push({
      $or: [
        { clientName: { $regex: escaped, $options: "i" } },
        { clientPhone: { $regex: escaped, $options: "i" } },
        ...(phone ? [{ normalizedClientPhone: { $regex: escapeSearch(phone), $options: "i" } }] : []),
        { title: { $regex: escaped, $options: "i" } },
        { reportType: { $regex: escaped, $options: "i" } },
        { labReportId: { $regex: escaped, $options: "i" } },
        { accessionNumber: { $regex: escaped, $options: "i" } },
      ],
    });
  }
  if (status) filter.status = status;
  if (risk === "flagged") filter.abnormal = { $gt: 0 };
  if (risk === "critical") filter.values = { $elemMatch: { status: { $in: ["High", "Low"] } } };
  if (risk === "normal") filter.abnormal = 0;
  if (from || to) filter.reportDate = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  if (sync === "claimed" || sync === "unclaimed") {
    const links = await context.db.collection("clientReportLinks").find(
      { labId: context.lab.id, state: sync },
      { projection: { _id: 0, labReportId: 1 } },
    ).toArray();
    filter.id = { $in: links.map((link) => link.labReportId).filter(Boolean) };
  }
  if (andFilters.length) filter.$and = andFilters;

  const [total, reportDocs] = await Promise.all([
    context.db.collection<LabReport>("labReports").countDocuments(filter),
    context.db.collection<LabReport>("labReports").find(
      filter,
      { projection: { _id: 0 } },
    ).sort({ reportDate: -1, createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
  ]);
  const reports = await enrichAdminReports(context.db, context.lab.id, reportDocs);
  const payload: AdminReportsPayload = { lab: context.lab, page, pageSize, reports, total };
  return NextResponse.json(payload);
}

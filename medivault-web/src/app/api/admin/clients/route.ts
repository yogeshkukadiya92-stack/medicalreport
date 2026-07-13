import { NextRequest, NextResponse } from "next/server";
import type { AdminClientsPayload } from "@/lib/admin-types";
import { enrichAdminClients, escapeSearch, getAdminContext, normalizeAdminPhone } from "@/lib/admin-server";
import type { LabClient } from "@/lib/vault-types";

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
  const link = params.get("link") || "";
  const attention = params.get("attention") || "";
  const page = positiveInteger(params.get("page"), 1, 10_000);
  const pageSize = positiveInteger(params.get("pageSize"), 25, 100);
  const filter: Record<string, unknown> = { labId: context.lab.id };

  if (q) {
    const escaped = escapeSearch(q);
    const phone = normalizeAdminPhone(q);
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
      ...(phone ? [{ normalizedPhone: { $regex: escapeSearch(phone), $options: "i" } }] : []),
    ];
  }

  const needsComputedFilter = Boolean(link || attention);
  const totalBeforeComputed = await context.db.collection<LabClient>("labClients").countDocuments(filter);
  const clientDocs = await context.db.collection<LabClient>("labClients").find(
    filter,
    { projection: { _id: 0 } },
  ).sort({ updatedAt: -1 })
    .skip(needsComputedFilter ? 0 : (page - 1) * pageSize)
    .limit(needsComputedFilter ? 1000 : pageSize)
    .toArray();

  const enriched = await enrichAdminClients(context.db, context.lab.id, clientDocs);
  const filtered = enriched.filter((client) => {
    if (link === "linked" && !client.appLinked) return false;
    if (link === "unlinked" && client.appLinked) return false;
    if (attention === "flagged" && client.abnormalReports === 0) return false;
    if (attention === "tasks" && client.openTasks === 0) return false;
    return true;
  });
  const clients = needsComputedFilter ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered;
  const total = needsComputedFilter ? filtered.length : totalBeforeComputed;

  const payload: AdminClientsPayload = {
    clients,
    lab: context.lab,
    page,
    pageSize,
    total,
  };
  return NextResponse.json(payload);
}

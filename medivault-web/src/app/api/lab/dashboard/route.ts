import { NextRequest, NextResponse } from "next/server";
import { getLabDashboardData } from "@/lib/lab-dashboard";
import { getLabContext } from "@/lib/lab-server";
import type { LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const [dashboard, reports] = await Promise.all([
    getLabDashboardData(context.db, context.lab),
    context.db
      .collection<LabReport>("labReports")
      .find({ labId: context.lab.id }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
  ]);
  const origin = request.nextUrl.origin;
  const bookingSlug = context.lab.bookingSlug ?? context.lab.id;

  return NextResponse.json({
    ...dashboard,
    bookingOps: {
      ...dashboard.bookingOps,
      bookingLink: `${origin}/book/${bookingSlug}`,
    },
    lab: context.lab,
    reports,
  });
}

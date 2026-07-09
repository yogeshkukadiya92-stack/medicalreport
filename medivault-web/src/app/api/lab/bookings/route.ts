import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import type { LabBooking } from "@/lib/vault-types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const status = request.nextUrl.searchParams.get("status");
  const filter: Record<string, unknown> = { labId: context.lab.id };
  if (status) filter.status = status;

  const bookings = await context.db
    .collection<LabBooking>("labBookings")
    .find(filter, { projection: { _id: 0 } })
    .sort({ preferredDate: 1, preferredTime: 1, createdAt: -1 })
    .limit(100)
    .toArray();

  return NextResponse.json({ bookings });
}

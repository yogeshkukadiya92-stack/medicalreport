import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import type { LabBooking, LabBookingStatus } from "@/lib/vault-types";

export const runtime = "nodejs";

const allowedStatuses: LabBookingStatus[] = ["requested", "confirmed", "sample_collected", "report_ready", "cancelled"];

type RouteParams = {
  params: Promise<{
    bookingId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { bookingId } = await params;
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => null)) as { status?: LabBookingStatus } | null;
  if (!body?.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Valid booking status is required." }, { status: 400 });
  }

  const booking = await context.db.collection<LabBooking>("labBookings").findOneAndUpdate(
    { id: bookingId, labId: context.lab.id },
    { $set: { status: body.status, updatedAt: new Date().toISOString() } },
    { projection: { _id: 0 }, returnDocument: "after" },
  );

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

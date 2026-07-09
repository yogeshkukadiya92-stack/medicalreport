import { NextRequest, NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { normalizePhone } from "@/lib/lab-utils";
import type { LabBooking, LabProfile, LabService } from "@/lib/vault-types";

export const runtime = "nodejs";

type BookingInput = {
  address?: string;
  clientName?: string;
  clientPhone?: string;
  collectionType?: "lab_visit" | "home_collection";
  notes?: string;
  preferredDate?: string;
  preferredTime?: string;
  serviceId?: string;
};

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function findLab(slug: string) {
  const db = await getMongoDb();
  const lab = await db.collection<LabProfile>("labs").findOne({ $or: [{ bookingSlug: slug }, { id: slug }] }, { projection: { _id: 0 } });
  return { db, lab };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Booking is not configured." }, { status: 503 });
  }

  const { slug } = await params;
  const { db, lab } = await findLab(slug);
  if (!lab) {
    return NextResponse.json({ error: "Lab booking link was not found." }, { status: 404 });
  }

  const services = await db
    .collection<LabService>("labServices")
    .find({ labId: lab.id, active: true }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    lab: {
      address: lab.address,
      id: lab.id,
      name: lab.name,
      phone: lab.phone,
    },
    services,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Booking is not configured." }, { status: 503 });
  }

  const { slug } = await params;
  const { db, lab } = await findLab(slug);
  if (!lab) {
    return NextResponse.json({ error: "Lab booking link was not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as BookingInput | null;
  const clientName = cleanText(body?.clientName);
  const clientPhone = cleanText(body?.clientPhone);
  const preferredDate = cleanText(body?.preferredDate);
  const preferredTime = cleanText(body?.preferredTime);
  const serviceId = cleanText(body?.serviceId);
  const normalizedPhone = normalizePhone(clientPhone);

  if (!clientName || !normalizedPhone || !preferredDate || !preferredTime) {
    return NextResponse.json({ error: "Name, phone, date, and time are required." }, { status: 400 });
  }

  const service = serviceId
    ? await db.collection<LabService>("labServices").findOne({ id: serviceId, labId: lab.id, active: true }, { projection: { _id: 0 } })
    : null;
  const collectionType = body?.collectionType === "home_collection" ? "home_collection" : "lab_visit";
  if (collectionType === "home_collection" && !cleanText(body?.address)) {
    return NextResponse.json({ error: "Address is required for home collection." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const booking: LabBooking = {
    id: `book-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    address: cleanText(body?.address) || undefined,
    clientName,
    clientPhone,
    collectionType,
    createdAt: now,
    labId: lab.id,
    labName: lab.name,
    normalizedPhone,
    notes: cleanText(body?.notes) || undefined,
    preferredDate,
    preferredTime,
    serviceId: service?.id,
    serviceName: service?.name ?? "General lab booking",
    status: "requested",
    updatedAt: now,
  };

  await db.collection<LabBooking>("labBookings").insertOne(booking);
  return NextResponse.json({ booking }, { status: 201 });
}

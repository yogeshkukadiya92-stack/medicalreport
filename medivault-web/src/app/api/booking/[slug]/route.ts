import { NextRequest, NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { normalizePhone } from "@/lib/lab-utils";
import { getRazorpayPublicConfig, verifyRazorpaySignature } from "@/lib/razorpay";
import type { LabBooking, LabPaymentOrder, LabProfile, LabService } from "@/lib/vault-types";

export const runtime = "nodejs";

type BookingInput = {
  address?: string;
  clientName?: string;
  clientPhone?: string;
  collectionType?: "lab_visit" | "home_collection";
  notes?: string;
  preferredDate?: string;
  preferredTime?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  serviceId?: string;
  paymentMethod?: "pay_at_lab" | "razorpay";
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
    payment: getRazorpayPublicConfig(),
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

  const paymentMethod = body?.paymentMethod === "razorpay" ? "razorpay" : "pay_at_lab";
  let paymentAmount: number | undefined;
  let paymentCurrency: string | undefined;
  let paymentOrderId: string | undefined;
  let paymentPaymentId: string | undefined;
  let paymentStatus: LabBooking["paymentStatus"] = "not_required";

  if (paymentMethod === "razorpay") {
    const razorpayOrderId = cleanText(body?.razorpayOrderId);
    const razorpayPaymentId = cleanText(body?.razorpayPaymentId);
    const razorpaySignature = cleanText(body?.razorpaySignature);
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Online payment confirmation is required." }, { status: 400 });
    }
    if (!verifyRazorpaySignature({ orderId: razorpayOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature })) {
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const order = await db.collection<LabPaymentOrder>("labPaymentOrders").findOne({ id: razorpayOrderId, labId: lab.id }, { projection: { _id: 0 } });
    if (!order || order.status !== "created") {
      return NextResponse.json({ error: "Payment order is invalid or already used." }, { status: 400 });
    }
    if (service?.id && order.serviceId !== service.id) {
      return NextResponse.json({ error: "Payment order does not match selected service." }, { status: 400 });
    }

    paymentAmount = order.amount;
    paymentCurrency = order.currency;
    paymentOrderId = razorpayOrderId;
    paymentPaymentId = razorpayPaymentId;
    paymentStatus = "paid";
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
    paymentAmount,
    paymentCurrency,
    paymentMethod,
    paymentOrderId,
    paymentPaymentId,
    paymentStatus,
    preferredDate,
    preferredTime,
    serviceId: service?.id,
    serviceName: service?.name ?? "General lab booking",
    status: "requested",
    updatedAt: now,
  };

  await db.collection<LabBooking>("labBookings").insertOne(booking);
  if (paymentOrderId) {
    await db.collection<LabPaymentOrder>("labPaymentOrders").updateOne({ id: paymentOrderId, labId: lab.id }, { $set: { status: "paid", updatedAt: now } });
  }
  return NextResponse.json({ booking }, { status: 201 });
}

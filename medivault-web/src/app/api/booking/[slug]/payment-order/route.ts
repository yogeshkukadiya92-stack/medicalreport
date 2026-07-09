import { NextRequest, NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { createRazorpayOrder, getRazorpayPublicConfig, isRazorpayConfigured } from "@/lib/razorpay";
import type { LabPaymentOrder, LabProfile, LabService } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{
    slug: string;
  }>;
};

type PaymentOrderInput = {
  serviceId?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function findLab(slug: string) {
  const db = await getMongoDb();
  const lab = await db.collection<LabProfile>("labs").findOne({ $or: [{ bookingSlug: slug }, { id: slug }] }, { projection: { _id: 0 } });
  return { db, lab };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Booking is not configured." }, { status: 503 });
  }
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay is not configured for this lab booking page." }, { status: 503 });
  }

  const { slug } = await params;
  const { db, lab } = await findLab(slug);
  if (!lab) {
    return NextResponse.json({ error: "Lab booking link was not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as PaymentOrderInput | null;
  const serviceId = cleanText(body?.serviceId);
  if (!serviceId) {
    return NextResponse.json({ error: "Select a priced service before online payment." }, { status: 400 });
  }

  const service = await db.collection<LabService>("labServices").findOne({ id: serviceId, labId: lab.id, active: true }, { projection: { _id: 0 } });
  if (!service || !service.price || service.price <= 0) {
    return NextResponse.json({ error: "Online payment is available only for services with a price." }, { status: 400 });
  }

  const payment = getRazorpayPublicConfig();
  const amountPaise = Math.round(service.price * 100);
  const receipt = `book-${Date.now()}`;
  const order = await createRazorpayOrder({
    amountPaise,
    currency: payment.currency,
    notes: {
      labId: lab.id,
      serviceId: service.id,
    },
    receipt,
  });

  const now = new Date().toISOString();
  const paymentOrder: LabPaymentOrder = {
    id: order.id,
    amount: order.amount,
    createdAt: now,
    currency: order.currency,
    labId: lab.id,
    receipt,
    serviceId: service.id,
    serviceName: service.name,
    status: "created",
    updatedAt: now,
  };
  await db.collection<LabPaymentOrder>("labPaymentOrders").insertOne(paymentOrder);

  return NextResponse.json({
    amount: order.amount,
    currency: order.currency,
    keyId: payment.keyId,
    orderId: order.id,
    serviceName: service.name,
  });
}

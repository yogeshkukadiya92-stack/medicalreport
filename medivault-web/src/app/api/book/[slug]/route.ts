import { NextRequest, NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import { labTemplates } from "@/lib/lab-templates";
import { normalizePhone } from "@/lib/lab-utils";
import type { LabProfile } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

type BookingInput = {
  age?: string;
  gender?: string;
  patientName?: string;
  patientPhone?: string;
  paymentMode?: "online" | "pay_at_lab";
  paymentReference?: string;
  selectedPanel?: string;
};

const panelPrices: Record<string, number> = {
  "body-composition": 500,
  cbc: 350,
  diabetes: 650,
  "lipid-profile": 800,
  thyroid: 600,
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function panelPrice(panelId: string) {
  return panelPrices[panelId] ?? 500;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!isMongoConfigured()) return NextResponse.json({ error: "Booking is not configured." }, { status: 503 });
  const { slug } = await params;
  const db = await getMongoDb();
  const lab = await db.collection<LabProfile>("labs").findOne({ bookingSlug: slug }, { projection: { _id: 0 } });
  if (!lab) return NextResponse.json({ error: "Booking link was not found." }, { status: 404 });

  return NextResponse.json({
    lab: {
      address: lab.address,
      bookingSlug: lab.bookingSlug,
      name: lab.name,
      phone: lab.phone,
    },
    panels: labTemplates.map((template) => ({
      category: template.category,
      id: template.id,
      name: template.name,
      price: panelPrice(template.id),
      tests: template.tests.length,
    })),
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isMongoConfigured()) return NextResponse.json({ error: "Booking is not configured." }, { status: 503 });
  const { slug } = await params;
  const db = await getMongoDb();
  const lab = await db.collection<LabProfile>("labs").findOne({ bookingSlug: slug }, { projection: { _id: 0 } });
  if (!lab) return NextResponse.json({ error: "Booking link was not found." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as BookingInput | null;
  const patientName = cleanText(body?.patientName);
  const patientPhone = cleanText(body?.patientPhone);
  const normalizedPhone = normalizePhone(patientPhone);
  const selectedPanel = cleanText(body?.selectedPanel) || "cbc";
  const template = labTemplates.find((item) => item.id === selectedPanel) ?? labTemplates[0];
  const paymentMode = body?.paymentMode === "pay_at_lab" ? "pay_at_lab" : "online";
  const paymentReference = cleanText(body?.paymentReference);

  if (!patientName || normalizedPhone.length < 8) {
    return NextResponse.json({ error: "Patient name and valid mobile number are required." }, { status: 400 });
  }
  if (paymentMode === "online" && !paymentReference) {
    return NextResponse.json({ error: "Payment reference is required for online booking." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const suffix = `${Date.now()}`.slice(-8);
  const amount = panelPrice(template.id);
  const bookingId = newId("booking");
  const order = {
    accessionNumber: `BK-${suffix}`,
    bookingId,
    createdAt: now,
    createdByUserId: "public-booking",
    id: newId("order"),
    labId: lab.id,
    patientAge: cleanText(body?.age),
    patientGender: cleanText(body?.gender),
    patientName,
    patientPhone,
    priority: "routine",
    sampleType: "Blood",
    source: "online_booking",
    stage: "ordered",
    testName: template.name,
    updatedAt: now,
  };
  const invoice = {
    amount,
    bookingId,
    createdAt: now,
    currency: "INR",
    id: newId("invoice"),
    labId: lab.id,
    patientName,
    patientPhone,
    paymentMode,
    paymentReference: paymentReference || undefined,
    status: paymentMode === "online" ? "paid" : "issued",
    testName: template.name,
    updatedAt: now,
  };

  await Promise.all([
    db.collection("labOrders").insertOne(order),
    db.collection("billingInvoices").insertOne(invoice),
    db.collection("labOperationalAudit").insertOne({
      action: "online_booking_created",
      createdAt: now,
      entityId: order.id,
      labId: lab.id,
      note: `${order.accessionNumber} booked online for ${patientName}.`,
      userId: "public-booking",
    }),
  ]);

  return NextResponse.json({ bookingId, invoice, order });
}

import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import type { LabService } from "@/lib/vault-types";

export const runtime = "nodejs";

type ServiceInput = {
  active?: boolean;
  description?: string;
  durationMinutes?: number | string;
  homeCollection?: boolean;
  name?: string;
  price?: number | string;
  sampleType?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(cleanText(value));
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const services = await context.db
    .collection<LabService>("labServices")
    .find({ labId: context.lab.id }, { projection: { _id: 0 } })
    .sort({ active: -1, createdAt: -1 })
    .toArray();

  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => null)) as ServiceInput | null;
  const name = cleanText(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Service name is required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const service: LabService = {
    id: `svc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    active: body?.active !== false,
    createdAt: now,
    description: cleanText(body?.description) || undefined,
    durationMinutes: cleanNumber(body?.durationMinutes),
    homeCollection: Boolean(body?.homeCollection),
    labId: context.lab.id,
    name,
    price: cleanNumber(body?.price),
    sampleType: cleanText(body?.sampleType) || undefined,
    updatedAt: now,
  };

  await context.db.collection<LabService>("labServices").insertOne(service);
  return NextResponse.json({ service }, { status: 201 });
}

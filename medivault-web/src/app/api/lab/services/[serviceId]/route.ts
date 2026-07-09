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

type RouteParams = {
  params: Promise<{
    serviceId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { serviceId } = await params;
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => null)) as ServiceInput | null;
  const name = cleanText(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Service name is required." }, { status: 400 });
  }

  const patch: Partial<LabService> = {
    active: body?.active !== false,
    description: cleanText(body?.description) || undefined,
    durationMinutes: cleanNumber(body?.durationMinutes),
    homeCollection: Boolean(body?.homeCollection),
    name,
    price: cleanNumber(body?.price),
    sampleType: cleanText(body?.sampleType) || undefined,
    updatedAt: new Date().toISOString(),
  };

  const result = await context.db
    .collection<LabService>("labServices")
    .findOneAndUpdate({ id: serviceId, labId: context.lab.id }, { $set: patch }, { projection: { _id: 0 }, returnDocument: "after" });

  if (!result) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  return NextResponse.json({ service: result });
}

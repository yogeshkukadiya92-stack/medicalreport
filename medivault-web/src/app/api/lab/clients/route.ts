import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import { normalizePhone } from "@/lib/lab-utils";
import type { LabClient } from "@/lib/vault-types";

export const runtime = "nodejs";

type ClientInput = {
  age?: number | string;
  gender?: string;
  name?: string;
  phone?: string;
};

function cleanClientInput(input: ClientInput | null) {
  const name = input?.name?.trim() || "";
  const phone = input?.phone?.trim() || "";
  const normalizedPhone = normalizePhone(phone);
  const parsedAge = input?.age === "" || input?.age === undefined ? undefined : Number(input.age);
  const gender = input?.gender?.trim() || undefined;
  return { age: typeof parsedAge === "number" && Number.isFinite(parsedAge) ? parsedAge : undefined, gender, name, normalizedPhone, phone };
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const search = request.nextUrl.searchParams.get("q")?.trim() || "";
  const filter: Record<string, unknown> = { labId: context.lab.id };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      { normalizedPhone: { $regex: normalizePhone(search), $options: "i" } },
    ];
  }

  const clients = await context.db
    .collection<LabClient>("labClients")
    .find(filter, { projection: { _id: 0 } })
    .sort({ updatedAt: -1 })
    .limit(150)
    .toArray();

  return NextResponse.json({ clients, lab: context.lab });
}

export async function POST(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => null)) as ClientInput | null;
  const input = cleanClientInput(body);

  if (!input.name) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }

  if (!input.normalizedPhone || input.normalizedPhone.length < 8) {
    return NextResponse.json({ error: "A valid client phone number is required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const existing = await context.db.collection<LabClient>("labClients").findOne(
    {
      labId: context.lab.id,
      normalizedPhone: input.normalizedPhone,
    },
    { projection: { _id: 0 } },
  );

  const client: LabClient = {
    id: existing?.id ?? `client-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    labId: context.lab.id,
    name: input.name,
    phone: input.phone,
    normalizedPhone: input.normalizedPhone,
    age: input.age,
    gender: input.gender,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await context.db.collection<LabClient>("labClients").updateOne(
    { labId: context.lab.id, normalizedPhone: input.normalizedPhone },
    {
      $set: client,
    },
    { upsert: true },
  );

  return NextResponse.json({
    client,
    created: !existing,
  });
}

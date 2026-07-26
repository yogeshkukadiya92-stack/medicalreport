import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateIntegrationKey, emitIntegrationEvent } from "@/lib/integration-server";
import { normalizePhone } from "@/lib/lab-utils";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

type NutritionIntegrationClient = {
  createdAt: string;
  goal?: string;
  id: string;
  labId: string;
  name: string;
  phone: string;
  source: "api";
  updatedAt: string;
};

async function context(request: NextRequest, scope: "nutrition.read" | "nutrition.write") {
  if (!isMongoConfigured()) return { error: "Database is not configured.", status: 503 as const };
  const db = await getMongoDb();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  const apiKey = await authenticateIntegrationKey(db, bearer, scope);
  if (!apiKey) return { error: `Valid API key with ${scope} scope is required.`, status: 401 as const };
  return { apiKey, db };
}

export async function GET(request: NextRequest) {
  const auth = await context(request, "nutrition.read");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const clients = await auth.db.collection<NutritionIntegrationClient>("nutritionIntegrationClients").find(
    { labId: auth.apiKey.labId },
    { projection: { _id: 0 } },
  ).sort({ updatedAt: -1 }).limit(100).toArray();
  return NextResponse.json({ data: clients, object: "list" });
}

export async function POST(request: NextRequest) {
  const auth = await context(request, "nutrition.write");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null) as { goal?: string; name?: string; phone?: string } | null;
  const name = body?.name?.trim().slice(0, 120) || "";
  const phone = normalizePhone(body?.phone || "");
  if (!name || phone.length < 8) return NextResponse.json({ error: "name and valid phone are required." }, { status: 400 });
  const now = new Date().toISOString();
  const existing = await auth.db.collection<NutritionIntegrationClient>("nutritionIntegrationClients").findOne(
    { labId: auth.apiKey.labId, phone },
    { projection: { _id: 0 } },
  );
  const client: NutritionIntegrationClient = {
    createdAt: existing?.createdAt || now,
    goal: body?.goal?.trim().slice(0, 200),
    id: existing?.id || `nutrition-client-${Date.now()}-${crypto.randomBytes(5).toString("hex")}`,
    labId: auth.apiKey.labId,
    name,
    phone,
    source: "api",
    updatedAt: now,
  };
  await auth.db.collection<NutritionIntegrationClient>("nutritionIntegrationClients").updateOne(
    { labId: client.labId, phone },
    { $set: client },
    { upsert: true },
  );
  void emitIntegrationEvent(auth.db, client.labId, "nutrition.client.updated", client).catch(() => undefined);
  return NextResponse.json({ data: client, object: "nutrition_client" }, { status: existing ? 200 : 201 });
}

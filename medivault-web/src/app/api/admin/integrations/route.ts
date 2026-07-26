import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-server";
import {
  createIntegrationApiKey,
  createWebhookSecret,
  encryptIntegrationSecret,
  ensureIntegrationIndexes,
  integrationScopes,
  normalizeScopes,
  normalizeWebhookEvents,
  validateWebhookUrl,
  webhookEvents,
  type IntegrationApiKey,
  type IntegrationWebhook,
} from "@/lib/integration-server";

export const runtime = "nodejs";

function publicApiKey(key: IntegrationApiKey) {
  const { tokenHash: _tokenHash, ...publicKey } = key;
  return publicKey;
}

function publicWebhook(webhook: IntegrationWebhook) {
  const { secretEncrypted: _secretEncrypted, ...publicValue } = webhook;
  return publicValue;
}

async function payload(context: Exclude<Awaited<ReturnType<typeof getAdminContext>>, { error: string; status: number }>) {
  await ensureIntegrationIndexes(context.db);
  const [apiKeys, webhooks, deliveries] = await Promise.all([
    context.db.collection<IntegrationApiKey>("integrationApiKeys").find(
      { labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).toArray(),
    context.db.collection<IntegrationWebhook>("integrationWebhooks").find(
      { labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).toArray(),
    context.db.collection("integrationDeliveries").find(
      { labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).limit(30).toArray(),
  ]);
  return {
    apiKeys: apiKeys.map(publicApiKey),
    availableEvents: webhookEvents,
    availableScopes: integrationScopes,
    deliveries,
    webhooks: webhooks.map(publicWebhook),
  };
}

export async function GET(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  return NextResponse.json(await payload(context));
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const kind = body?.kind;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
  if (!name) return NextResponse.json({ error: "Integration name is required." }, { status: 400 });
  await ensureIntegrationIndexes(context.db);
  const now = new Date().toISOString();

  if (kind === "api_key") {
    const scopes = normalizeScopes(body?.scopes);
    if (!scopes.length) return NextResponse.json({ error: "Select at least one API scope." }, { status: 400 });
    const generated = createIntegrationApiKey();
    const apiKey: IntegrationApiKey = {
      active: true,
      createdAt: now,
      id: `api-key-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`,
      labId: context.lab.id,
      name,
      scopes,
      tokenHash: generated.tokenHash,
      tokenPrefix: generated.tokenPrefix,
      updatedAt: now,
    };
    await context.db.collection<IntegrationApiKey>("integrationApiKeys").insertOne(apiKey);
    return NextResponse.json({ ...(await payload(context)), createdToken: generated.token }, { status: 201 });
  }

  if (kind === "webhook") {
    const events = normalizeWebhookEvents(body?.events);
    const url = typeof body?.url === "string" ? body.url.trim().slice(0, 1000) : "";
    const urlError = validateWebhookUrl(url);
    if (urlError) return NextResponse.json({ error: urlError }, { status: 400 });
    if (!events.length) return NextResponse.json({ error: "Select at least one webhook event." }, { status: 400 });
    const secret = createWebhookSecret();
    const webhook: IntegrationWebhook = {
      active: true,
      createdAt: now,
      events,
      failureCount: 0,
      id: `webhook-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`,
      labId: context.lab.id,
      name,
      secretEncrypted: encryptIntegrationSecret(secret),
      updatedAt: now,
      url,
    };
    await context.db.collection<IntegrationWebhook>("integrationWebhooks").insertOne(webhook);
    return NextResponse.json({ ...(await payload(context)), createdSecret: secret }, { status: 201 });
  }

  return NextResponse.json({ error: "Unsupported integration type." }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const active = body?.active;
  const kind = body?.kind;
  if (!id || typeof active !== "boolean") return NextResponse.json({ error: "id and active are required." }, { status: 400 });
  const collection = kind === "webhook" ? "integrationWebhooks" : "integrationApiKeys";
  await context.db.collection(collection).updateOne(
    { id, labId: context.lab.id },
    { $set: { active, updatedAt: new Date().toISOString() } },
  );
  return NextResponse.json(await payload(context));
}

export async function DELETE(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const id = request.nextUrl.searchParams.get("id") || "";
  const kind = request.nextUrl.searchParams.get("kind");
  const collection = kind === "webhook" ? "integrationWebhooks" : "integrationApiKeys";
  await context.db.collection(collection).deleteOne({ id, labId: context.lab.id });
  return NextResponse.json(await payload(context));
}

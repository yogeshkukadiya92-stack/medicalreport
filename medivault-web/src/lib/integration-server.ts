import crypto from "node:crypto";
import { lookup } from "node:dns/promises";
import type { Db } from "mongodb";

export const integrationScopes = [
  "lab.read",
  "lab.write",
  "nutrition.read",
  "nutrition.write",
  "body_composition.read",
  "body_composition.write",
] as const;

export const webhookEvents = [
  "lab.report.created",
  "lab.report.published",
  "nutrition.client.updated",
  "nutrition.plan.created",
  "body_composition.scan.created",
  "body_composition.scan.verified",
] as const;

export type IntegrationScope = (typeof integrationScopes)[number];
export type WebhookEvent = (typeof webhookEvents)[number];

export type IntegrationApiKey = {
  active: boolean;
  createdAt: string;
  id: string;
  labId: string;
  lastUsedAt?: string;
  name: string;
  scopes: IntegrationScope[];
  tokenHash: string;
  tokenPrefix: string;
  updatedAt: string;
};

export type IntegrationWebhook = {
  active: boolean;
  createdAt: string;
  events: WebhookEvent[];
  failureCount: number;
  id: string;
  labId: string;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: number;
  name: string;
  secretEncrypted: string;
  updatedAt: string;
  url: string;
};

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encryptionKey() {
  const source = process.env.INTEGRATION_ENCRYPTION_KEY
    || process.env.N8N_IMPORT_TOKEN
    || process.env.ADMIN_BOOTSTRAP_PASSWORD
    || "";
  if (!source) throw new Error("Integration encryption is not configured.");
  return crypto.createHash("sha256").update(source).digest();
}

export function encryptIntegrationSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((value) => value.toString("base64url")).join(".");
}

export function decryptIntegrationSecret(payload: string) {
  const [ivValue, tagValue, encryptedValue] = payload.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Webhook secret is invalid.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createIntegrationApiKey() {
  const token = `mv_live_${crypto.randomBytes(32).toString("base64url")}`;
  return { token, tokenHash: hash(token), tokenPrefix: token.slice(0, 16) };
}

export function createWebhookSecret() {
  return `whsec_${crypto.randomBytes(32).toString("base64url")}`;
}

export function signWebhookPayload(secret: string, timestamp: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
}

export function normalizeScopes(value: unknown): IntegrationScope[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is IntegrationScope => (
    typeof item === "string" && integrationScopes.includes(item as IntegrationScope)
  )))];
}

export function normalizeWebhookEvents(value: unknown): WebhookEvent[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is WebhookEvent => (
    typeof item === "string" && webhookEvents.includes(item as WebhookEvent)
  )))];
}

export function validateWebhookUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Enter a valid HTTPS webhook URL.";
  }
  if (url.protocol !== "https:") return "Webhook URL must use HTTPS.";
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost"
    || host === "::1"
    || host.endsWith(".local")
    || /^127\./.test(host)
    || /^10\./.test(host)
    || /^192\.168\./.test(host)
    || /^169\.254\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) return "Private or local webhook destinations are not allowed.";
  return "";
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1"
    || normalized === "0.0.0.0"
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || normalized.startsWith("fe80:")
    || /^127\./.test(normalized)
    || /^10\./.test(normalized)
    || /^192\.168\./.test(normalized)
    || /^169\.254\./.test(normalized)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}

async function assertPublicWebhookDestination(value: string) {
  const urlError = validateWebhookUrl(value);
  if (urlError) throw new Error(urlError);
  const url = new URL(value);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
    throw new Error("Webhook destination resolves to a private network.");
  }
}

export async function ensureIntegrationIndexes(db: Db) {
  await Promise.all([
    db.collection<IntegrationApiKey>("integrationApiKeys").createIndex({ labId: 1, id: 1 }, { unique: true }),
    db.collection<IntegrationApiKey>("integrationApiKeys").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection<IntegrationWebhook>("integrationWebhooks").createIndex({ labId: 1, id: 1 }, { unique: true }),
    db.collection("integrationDeliveries").createIndex({ labId: 1, createdAt: -1 }),
  ]);
}

export async function authenticateIntegrationKey(db: Db, bearer: string, scope: IntegrationScope) {
  if (!bearer.startsWith("mv_live_")) return null;
  const apiKey = await db.collection<IntegrationApiKey>("integrationApiKeys").findOne(
    { active: true, tokenHash: hash(bearer), scopes: scope },
    { projection: { _id: 0 } },
  );
  if (!apiKey) return null;
  await db.collection<IntegrationApiKey>("integrationApiKeys").updateOne(
    { id: apiKey.id },
    { $set: { lastUsedAt: new Date().toISOString() } },
  );
  return apiKey;
}

export async function deliverWebhook(
  db: Db,
  webhook: IntegrationWebhook,
  event: WebhookEvent,
  data: unknown,
) {
  const createdAt = new Date().toISOString();
  const deliveryId = `delivery-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  const payload = JSON.stringify({ apiVersion: "2026-07-01", createdAt, data, event, id: deliveryId });
  const secret = decryptIntegrationSecret(webhook.secretEncrypted);
  const signature = signWebhookPayload(secret, createdAt, payload);
  let status = 0;
  let error = "";
  try {
    await assertPublicWebhookDestination(webhook.url);
    const response = await fetch(webhook.url, {
      body: payload,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MediVault-Webhooks/1.0",
        "X-MediVault-Delivery": deliveryId,
        "X-MediVault-Signature": `v1=${signature}`,
        "X-MediVault-Timestamp": createdAt,
      },
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    status = response.status;
    if (!response.ok) error = `Destination returned HTTP ${response.status}.`;
  } catch (deliveryError) {
    error = deliveryError instanceof Error ? deliveryError.message : "Webhook delivery failed.";
  }
  const success = status >= 200 && status < 300;
  await Promise.all([
    db.collection("integrationDeliveries").insertOne({
      createdAt,
      error,
      event,
      id: deliveryId,
      labId: webhook.labId,
      status,
      success,
      webhookId: webhook.id,
    }),
    db.collection<IntegrationWebhook>("integrationWebhooks").updateOne(
      { id: webhook.id },
      {
        $inc: { failureCount: success ? 0 : 1 },
        $set: { lastDeliveryAt: createdAt, lastDeliveryStatus: status, updatedAt: createdAt },
      },
    ),
  ]);
  return { deliveryId, error, status, success };
}

export async function emitIntegrationEvent(
  db: Db,
  labId: string,
  event: WebhookEvent,
  data: unknown,
) {
  const webhooks = await db.collection<IntegrationWebhook>("integrationWebhooks").find(
    { active: true, events: event, labId },
    { projection: { _id: 0 } },
  ).toArray();
  await Promise.allSettled(webhooks.map((webhook) => deliverWebhook(db, webhook, event, data)));
}

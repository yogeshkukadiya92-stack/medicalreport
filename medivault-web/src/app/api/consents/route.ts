import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

type ConsentInput = {
  consent_type?: string;
  consent_version?: string;
  is_granted?: boolean;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to load consents." }, { status: 401 });
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is required for consent storage." }, { status: 503 });
  }

  const db = await getMongoDb();
  await db.collection("consents").createIndex({ userId: 1, consent_type: 1 }, { unique: true });
  const consents = await db.collection("consents").find({ userId }, { projection: { _id: 0 } }).sort({ updated_at: -1 }).toArray();
  return NextResponse.json({ consents });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in is required to update consents." }, { status: 401 });
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is required for consent storage." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as ConsentInput | null;
  const consentType = cleanText(body?.consent_type);
  const consentVersion = cleanText(body?.consent_version) || "1.0";
  if (!consentType) {
    return NextResponse.json({ error: "Consent type is required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const isGranted = body?.is_granted !== false;
  const db = await getMongoDb();
  await db.collection("consents").createIndex({ userId: 1, consent_type: 1 }, { unique: true });
  await db.collection("consents").updateOne(
    { userId, consent_type: consentType },
    {
      $set: {
        consent_type: consentType,
        consent_version: consentVersion,
        granted_at: isGranted ? now : null,
        is_granted: isGranted,
        updated_at: now,
        userId,
      },
      $setOnInsert: {
        created_at: now,
      },
    },
    { upsert: true },
  );

  const consent = await db.collection("consents").findOne({ userId, consent_type: consentType }, { projection: { _id: 0 } });
  return NextResponse.json({ consent });
}

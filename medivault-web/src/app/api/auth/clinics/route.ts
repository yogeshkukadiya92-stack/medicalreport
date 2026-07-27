import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, isBootstrapAdminUserId } from "@/lib/auth-server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";
import type { LabProfile, LabUser } from "@/lib/vault-types";

export const runtime = "nodejs";

function clean(value: unknown, max = 100) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function listClinics(userId: string) {
  const db = await getMongoDb();
  const memberships = await db.collection<LabUser>("labUsers")
    .find({ userId }, { projection: { _id: 0 } }).toArray();
  const labs = memberships.length
    ? await db.collection<LabProfile>("labs").find(
      { id: { $in: memberships.map((item) => item.labId) } },
      { projection: { _id: 0 } },
    ).toArray()
    : [];
  const membershipByLab = new Map(memberships.map((item) => [item.labId, item]));
  return labs.map((lab) => ({
    id: lab.id,
    name: lab.name,
    role: membershipByLab.get(lab.id)?.role,
    workspaceAccess: membershipByLab.get(lab.id)?.workspaceAccess ?? ["lab"],
  }));
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isMongoConfigured()) return NextResponse.json({ clinics: [] });
  return NextResponse.json({
    activeClinicId: request.cookies.get("medivault_lab_id")?.value ?? null,
    clinics: await listClinics(userId),
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const labId = clean((await request.json().catch(() => null) as { labId?: string } | null)?.labId, 120);
  const db = await getMongoDb();
  const membership = await db.collection<LabUser>("labUsers").findOne({ labId, userId });
  if (!membership) return NextResponse.json({ error: "You do not have access to this clinic." }, { status: 403 });
  const response = NextResponse.json({ activeClinicId: labId });
  response.cookies.set("medivault_lab_id", labId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 180,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string } | null;
  const name = clean(body?.name);
  if (name.length < 2) return NextResponse.json({ error: "Clinic name is required." }, { status: 400 });
  const db = await getMongoDb();
  const canCreate = isBootstrapAdminUserId(userId) || Boolean(await db.collection<LabUser>("labUsers").findOne({
    role: "lab_admin",
    userId,
  }));
  if (!canCreate) return NextResponse.json({ error: "Only an existing clinic admin can create another clinic." }, { status: 403 });
  const now = new Date().toISOString();
  const labId = `lab-${crypto.randomUUID()}`;
  await Promise.all([
    db.collection<LabProfile>("labs").insertOne({
      createdAt: now,
      id: labId,
      name,
      ownerUserId: userId,
      updatedAt: now,
    }),
    db.collection<LabUser>("labUsers").insertOne({
      createdAt: now,
      id: `${labId}:${userId}`,
      labId,
      role: "lab_admin",
      updatedAt: now,
      userId,
      workspaceAccess: ["lab", "nutrition", "body_composition"],
    }),
  ]);
  return NextResponse.json({ clinics: await listClinics(userId), createdClinicId: labId }, { status: 201 });
}

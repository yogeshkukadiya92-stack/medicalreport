import { NextRequest, NextResponse } from "next/server";
import { createManagedAuthUser } from "@/lib/auth-server";
import { getAdminContext } from "@/lib/admin-server";
import type { AuthUser } from "@/lib/auth-server";
import type { LabRole, LabUser } from "@/lib/vault-types";

export const runtime = "nodejs";

type LabUserInput = {
  email?: string;
  name?: string;
  password?: string;
  phone?: string;
  role?: LabRole;
};

type LabCredentialRow = LabUser & {
  email?: string;
  phone?: string;
};

const allowedRoles: LabRole[] = ["lab_admin", "lab_staff", "pathologist", "technician", "collector", "cashier"];

function isoNow() {
  return new Date().toISOString();
}

async function listLabCredentials(context: Exclude<Awaited<ReturnType<typeof getAdminContext>>, { error: string; status: number }>) {
  const labUsers = await context.db.collection<LabUser>("labUsers").find(
    { labId: context.lab.id },
    { projection: { _id: 0 } },
  ).sort({ updatedAt: -1 }).toArray();
  const userIds = labUsers.map((labUser) => labUser.userId);
  const users = userIds.length
    ? await context.db.collection<AuthUser>("authUsers").find(
      { id: { $in: userIds } },
      { projection: { _id: 0, email: 1, id: 1, name: 1, phone: 1, createdAt: 1, updatedAt: 1 } },
    ).toArray()
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));
  return labUsers.map((labUser): LabCredentialRow => {
    const user = userById.get(labUser.userId);
    return {
      ...labUser,
      email: user?.email,
      name: labUser.name || user?.name,
      phone: user?.phone,
    };
  });
}

export async function GET(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const labUsers = await listLabCredentials(context);
  return NextResponse.json({ labUsers });
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = (await request.json().catch(() => null)) as LabUserInput | null;
  const role = allowedRoles.includes(body?.role as LabRole) ? body?.role as LabRole : "lab_staff";
  const name = body?.name?.trim() || "";

  try {
    const user = await createManagedAuthUser({
      email: body?.email ?? "",
      name,
      password: body?.password ?? "",
      phone: body?.phone ?? "",
    });
    const now = isoNow();
    const labUser: LabUser = {
      id: `${context.lab.id}:${user.id}`,
      userId: user.id,
      labId: context.lab.id,
      role,
      name: name || user.name,
      createdAt: now,
      updatedAt: now,
    };

    await context.db.collection<LabUser>("labUsers").updateOne(
      { labId: context.lab.id, userId: user.id },
      {
        $set: {
          name: labUser.name,
          role,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          id: labUser.id,
          labId: context.lab.id,
          userId: user.id,
        },
      },
      { upsert: true },
    );
    await context.db.collection("platformAuditLogs").insertOne({
      action: "lab_credential_created",
      actorUserId: context.userId,
      createdAt: now,
      entityId: user.id,
      entityType: "lab_user",
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      labId: context.lab.id,
      metadata: { email: user.email, role },
    });

    const labUsers = await listLabCredentials(context);
    return NextResponse.json({ labUsers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lab credential could not be created.";
    const status = message.includes("already exists") ? 409 : message.includes("MongoDB") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

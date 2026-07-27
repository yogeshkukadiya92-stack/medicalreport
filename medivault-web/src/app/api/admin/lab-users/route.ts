import { NextRequest, NextResponse } from "next/server";
import { createManagedAuthUser, revokeManagedAuthUserSessions, updateManagedAuthUser } from "@/lib/auth-server";
import { getAdminContext } from "@/lib/admin-server";
import type { AuthUser } from "@/lib/auth-server";
import type { LabRole, LabUser, WorkspaceAccess } from "@/lib/vault-types";
import { labRolePermissions, type LabPermission } from "@/lib/normalized-health";

export const runtime = "nodejs";

type LabUserInput = {
  accountStatus?: "active" | "suspended";
  email?: string;
  name?: string;
  password?: string;
  permissionOverrides?: {
    allow?: LabPermission[];
    deny?: LabPermission[];
  };
  phone?: string;
  role?: LabRole;
  workspaceAccess?: WorkspaceAccess[];
  userId?: string;
  revokeSessions?: boolean;
};

type LabCredentialRow = LabUser & {
  accountStatus?: "active" | "suspended";
  email?: string;
  lastSeenAt?: string;
  phone?: string;
  sessionCount?: number;
};

const allowedRoles: LabRole[] = ["lab_admin", "lab_staff", "pathologist", "technician", "collector", "cashier"];
const allowedWorkspaces: WorkspaceAccess[] = ["lab", "nutrition", "body_composition"];
const allowedPermissions = [...new Set(Object.values(labRolePermissions).flat())];

function normalizePermissionOverrides(value: LabUserInput["permissionOverrides"]) {
  if (!value) return undefined;
  const allow = allowedPermissions.filter((permission) => value.allow?.includes(permission));
  const deny = allowedPermissions.filter((permission) => value.deny?.includes(permission));
  return { allow, deny };
}

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
      { projection: { _id: 0, accountStatus: 1, email: 1, id: 1, name: 1, phone: 1, createdAt: 1, updatedAt: 1 } },
    ).toArray()
    : [];
  const sessions = userIds.length
    ? await context.db.collection<{ expiresAt: string; lastSeenAt: string; userId: string }>("authSessions").find(
      { userId: { $in: userIds }, expiresAt: { $gt: new Date().toISOString() } },
      { projection: { _id: 0, expiresAt: 1, lastSeenAt: 1, userId: 1 } },
    ).toArray()
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const sessionsByUserId = sessions.reduce((map, session) => {
    const current = map.get(session.userId) ?? [];
    current.push(session);
    map.set(session.userId, current);
    return map;
  }, new Map<string, typeof sessions>());
  return labUsers.map((labUser): LabCredentialRow => {
    const user = userById.get(labUser.userId);
    const userSessions = sessionsByUserId.get(labUser.userId) ?? [];
    return {
      ...labUser,
      accountStatus: user?.accountStatus ?? "active",
      email: user?.email,
      lastSeenAt: userSessions.sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))[0]?.lastSeenAt,
      name: labUser.name || user?.name,
      phone: user?.phone,
      sessionCount: userSessions.length,
      workspaceAccess: labUser.userId === context.userId
        ? ["lab", "nutrition", "body_composition"]
        : labUser.workspaceAccess ?? ["lab"],
    };
  });
}

export async function PATCH(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = (await request.json().catch(() => null)) as LabUserInput | null;
  const userId = body?.userId?.trim() || "";
  if (!userId) return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  if (userId === context.userId) {
    return NextResponse.json({ error: "Owner admin access cannot be changed here." }, { status: 400 });
  }

  const membership = await context.db.collection<LabUser>("labUsers").findOne(
    { labId: context.lab.id, userId },
    { projection: { _id: 0 } },
  );
  if (!membership) return NextResponse.json({ error: "Dashboard user was not found." }, { status: 404 });
  if (body?.accountStatus !== undefined && !["active", "suspended"].includes(body.accountStatus)) {
    return NextResponse.json({ error: "Select a valid account status." }, { status: 400 });
  }

  try {
    const now = isoNow();
    const updates: Partial<LabUser> = { updatedAt: now };
    if (body?.role !== undefined) {
      if (!allowedRoles.includes(body.role)) return NextResponse.json({ error: "Select a valid role." }, { status: 400 });
      updates.role = body.role;
    }
    if (body?.workspaceAccess !== undefined) {
      const workspaceAccess = allowedWorkspaces.filter((workspace) => body.workspaceAccess?.includes(workspace));
      if (!workspaceAccess.length) return NextResponse.json({ error: "Select at least one dashboard." }, { status: 400 });
      updates.workspaceAccess = workspaceAccess;
    }
    if (body?.permissionOverrides !== undefined) {
      updates.permissionOverrides = normalizePermissionOverrides(body.permissionOverrides);
    }
    await context.db.collection<LabUser>("labUsers").updateOne({ labId: context.lab.id, userId }, { $set: updates });

    if (body?.accountStatus || body?.password !== undefined) {
      await updateManagedAuthUser({
        accountStatus: body.accountStatus,
        password: body.password,
        userId,
      });
    }
    if (body?.revokeSessions) await revokeManagedAuthUserSessions(userId);

    await context.db.collection("platformAuditLogs").insertOne({
      action: body?.revokeSessions ? "user_sessions_revoked" : body?.password !== undefined ? "user_password_reset" : "dashboard_user_updated",
      actorUserId: context.userId,
      createdAt: now,
      entityId: userId,
      entityType: "dashboard_user",
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      labId: context.lab.id,
      metadata: {
        accountStatus: body?.accountStatus,
        role: body?.role,
        permissionOverrides: body?.permissionOverrides,
        workspaceAccess: body?.workspaceAccess,
      },
    });

    return NextResponse.json({ labUsers: await listLabCredentials(context) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "User could not be updated.";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 400 });
  }
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
  const workspaceAccess = allowedWorkspaces.filter((workspace) => body?.workspaceAccess?.includes(workspace));
  if (!workspaceAccess.length) {
    return NextResponse.json({ error: "Select at least one dashboard for this user." }, { status: 400 });
  }
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
      permissionOverrides: normalizePermissionOverrides(body?.permissionOverrides),
      workspaceAccess,
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
          permissionOverrides: labUser.permissionOverrides,
          workspaceAccess,
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
      metadata: { email: user.email, role, workspaceAccess, permissionOverrides: labUser.permissionOverrides },
    });

    const labUsers = await listLabCredentials(context);
    return NextResponse.json({ labUsers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lab credential could not be created.";
    const status = message.includes("already exists") ? 409 : message.includes("MongoDB") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

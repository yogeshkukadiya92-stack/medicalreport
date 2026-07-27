import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-server";

export const runtime = "nodejs";

type AuditRow = {
  action: string;
  actorUserId?: string;
  createdAt: string;
  entityId?: string;
  entityType?: string;
  id: string;
  metadata?: Record<string, unknown>;
  note?: string;
};

export async function GET(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const [platformLogs, reportLogs, activeSessions, suspendedUsers, totalUsers] = await Promise.all([
    context.db.collection<AuditRow>("platformAuditLogs").find(
      { labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).limit(80).toArray(),
    context.db.collection<AuditRow>("labReportAuditLogs").find(
      { labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).limit(80).toArray(),
    context.db.collection("authSessions").countDocuments({ expiresAt: { $gt: new Date().toISOString() } }),
    context.db.collection("authUsers").countDocuments({ accountStatus: "suspended" }),
    context.db.collection("authUsers").countDocuments(),
  ]);

  const userIds = Array.from(new Set([...platformLogs, ...reportLogs].map((log) => log.actorUserId).filter((id): id is string => Boolean(id))));
  const users = userIds.length
    ? await context.db.collection<{ email?: string; id: string; name?: string }>("authUsers").find(
      { id: { $in: userIds } },
      { projection: { _id: 0, email: 1, id: 1, name: 1 } },
    ).toArray()
    : [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const logs = [...platformLogs, ...reportLogs]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 100)
    .map((log) => ({
      ...log,
      actor: userById.get(log.actorUserId || "")?.name || userById.get(log.actorUserId || "")?.email || "System",
    }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    logs,
    metrics: {
      activeSessions,
      auditEvents: platformLogs.length + reportLogs.length,
      suspendedUsers,
      totalUsers,
    },
  });
}

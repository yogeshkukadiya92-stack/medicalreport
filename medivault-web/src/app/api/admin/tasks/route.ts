import { NextRequest, NextResponse } from "next/server";
import type { AdminTask, AdminTaskPriority, AdminTaskStatus, AdminTaskType, AdminTasksPayload } from "@/lib/admin-types";
import { getAdminContext, getAdminSystemTasks } from "@/lib/admin-server";
import { todayDate } from "@/lib/lab-dashboard";
import type { LabClient } from "@/lib/vault-types";

export const runtime = "nodejs";

const priorities: AdminTaskPriority[] = ["low", "medium", "high", "urgent"];
const statuses: AdminTaskStatus[] = ["open", "in_progress", "completed"];
const taskTypes: AdminTaskType[] = ["follow_up", "critical", "report", "payment", "general"];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

function priorityRank(task: AdminTask) {
  return { urgent: 0, high: 1, medium: 2, low: 3 }[task.priority];
}

async function readTasks(context: Exclude<Awaited<ReturnType<typeof getAdminContext>>, { error: string; status: number }>) {
  const today = todayDate();
  const [manualTasks, systemTasks, clients] = await Promise.all([
    context.db.collection<AdminTask>("adminTasks").find(
      { labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ dueDate: 1, updatedAt: -1 }).limit(500).toArray(),
    getAdminSystemTasks(context.db, context.lab.id),
    context.db.collection<LabClient>("labClients").find(
      { labId: context.lab.id },
      { projection: { _id: 0, id: 1, name: 1, phone: 1 } },
    ).sort({ name: 1 }).limit(500).toArray(),
  ]);
  const normalizedManual = manualTasks.map((task) => ({ ...task, source: "manual" as const }));
  const tasks = [...systemTasks, ...normalizedManual].sort((left, right) => {
    if (left.status === "completed" && right.status !== "completed") return 1;
    if (right.status === "completed" && left.status !== "completed") return -1;
    return priorityRank(left) - priorityRank(right) || left.dueDate.localeCompare(right.dueDate);
  });
  return {
    clients,
    summary: {
      completed: tasks.filter((task) => task.status === "completed").length,
      dueToday: tasks.filter((task) => task.status !== "completed" && task.dueDate === today).length,
      open: tasks.filter((task) => task.status !== "completed").length,
      overdue: tasks.filter((task) => task.status !== "completed" && task.dueDate < today).length,
    },
    tasks,
  };
}

export async function GET(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const result = await readTasks(context);
  const payload: AdminTasksPayload = { ...result, lab: context.lab };
  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = cleanText(body?.title);
  const dueDate = cleanText(body?.dueDate);
  const clientId = cleanText(body?.clientId);
  const priorityValue = cleanText(body?.priority) as AdminTaskPriority;
  const typeValue = cleanText(body?.type) as AdminTaskType;
  if (!title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });
  if (!isDateKey(dueDate)) return NextResponse.json({ error: "A valid due date is required." }, { status: 400 });

  const client = clientId ? await context.db.collection<LabClient>("labClients").findOne(
    { id: clientId, labId: context.lab.id },
    { projection: { _id: 0 } },
  ) : null;
  if (clientId && !client) return NextResponse.json({ error: "Selected client was not found." }, { status: 404 });

  const now = new Date().toISOString();
  const task: AdminTask = {
    assignedTo: cleanText(body?.assignedTo) || undefined,
    clientId: client?.id,
    clientName: client?.name,
    clientPhone: client?.phone,
    createdAt: now,
    createdByUserId: context.userId,
    dueDate,
    id: `task-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    labId: context.lab.id,
    note: cleanText(body?.note) || undefined,
    priority: priorities.includes(priorityValue) ? priorityValue : "medium",
    source: "manual",
    status: "open",
    title: title.slice(0, 160),
    type: taskTypes.includes(typeValue) ? typeValue : "general",
    updatedAt: now,
  };
  await Promise.all([
    context.db.collection<AdminTask>("adminTasks").insertOne(task),
    context.db.collection("platformAuditLogs").insertOne({
      action: "admin_task_created",
      actorUserId: context.userId,
      createdAt: now,
      entityId: task.id,
      entityType: "admin_task",
      id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      labId: context.lab.id,
      metadata: { clientId: task.clientId, dueDate: task.dueDate, priority: task.priority },
    }),
  ]);
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const taskId = cleanText(body?.taskId);
  const status = cleanText(body?.status) as AdminTaskStatus;
  if (!taskId || taskId.startsWith("system-")) {
    return NextResponse.json({ error: "Only manual tasks can be updated here." }, { status: 400 });
  }
  if (!statuses.includes(status)) return NextResponse.json({ error: "A valid task status is required." }, { status: 400 });

  const now = new Date().toISOString();
  const result = await context.db.collection<AdminTask>("adminTasks").findOneAndUpdate(
    { id: taskId, labId: context.lab.id },
    { $set: { status, updatedAt: now } },
    { projection: { _id: 0 }, returnDocument: "after" },
  );
  if (!result) return NextResponse.json({ error: "Task was not found." }, { status: 404 });
  await context.db.collection("platformAuditLogs").insertOne({
    action: "admin_task_status_changed",
    actorUserId: context.userId,
    createdAt: now,
    entityId: taskId,
    entityType: "admin_task",
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    labId: context.lab.id,
    metadata: { status },
  });
  return NextResponse.json({ task: result });
}

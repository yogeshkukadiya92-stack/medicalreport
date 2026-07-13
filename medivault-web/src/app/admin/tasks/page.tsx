"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import type { AdminTask, AdminTaskPriority, AdminTaskStatus, AdminTaskType, AdminTasksPayload } from "@/lib/admin-types";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, AdminStatCard, StatusPill } from "@/app/admin/_components/admin-ui";

type TaskForm = {
  assignedTo: string;
  clientId: string;
  dueDate: string;
  note: string;
  priority: AdminTaskPriority;
  title: string;
  type: AdminTaskType;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function initialClientId() {
  return typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("clientId") || "";
}

function emptyForm(): TaskForm {
  return { assignedTo: "", clientId: initialClientId(), dueDate: todayKey(), note: "", priority: "medium", title: "", type: "follow_up" };
}

function formatDate(value?: string) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function priorityTone(priority: AdminTaskPriority) {
  if (priority === "urgent" || priority === "high") return "critical" as const;
  if (priority === "medium") return "warning" as const;
  return "neutral" as const;
}

export default function AdminTasksPage() {
  const { session, status } = useAuth();
  const [data, setData] = useState<AdminTasksPayload | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [filters, setFilters] = useState({ priority: "", q: "", status: "active" });
  const [isCreateOpen, setIsCreateOpen] = useState(Boolean(initialClientId()));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadTasks = useCallback(async () => {
    if (status === "loading") return;
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tasks", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Tasks could not be loaded.");
      setData(result as AdminTasksPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Tasks could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => {
    if (!isCreateOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !isSaving) setIsCreateOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [isCreateOpen, isSaving]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!session?.access_token) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Task could not be created.");
      setForm(emptyForm());
      setIsCreateOpen(false);
      setMessage("Task created and added to the live work queue.");
      await loadTasks();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Task could not be created.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateTask(task: AdminTask, nextStatus: AdminTaskStatus) {
    if (!session?.access_token || task.source === "system") return;
    setUpdatingTaskId(task.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, taskId: task.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Task could not be updated.");
      setMessage(nextStatus === "completed" ? "Task marked complete." : "Task status updated.");
      await loadTasks();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Task could not be updated.");
    } finally {
      setUpdatingTaskId("");
    }
  }

  const normalizedQuery = filters.q.trim().toLowerCase();
  const filteredTasks = (data?.tasks ?? []).filter((task) => {
    if (filters.status === "active" && task.status === "completed") return false;
    if (filters.status === "completed" && task.status !== "completed") return false;
    if (filters.status === "system" && task.source !== "system") return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (normalizedQuery && ![task.title, task.clientName, task.clientPhone, task.note, task.assignedTo].join(" ").toLowerCase().includes(normalizedQuery)) return false;
    return true;
  });

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Retention and action desk"
        title="Tasks & follow-ups"
        description="Manage manual follow-ups together with live critical-value, delayed-order and patient-link alerts generated by the system."
        actions={<button data-testid="add-admin-task" type="button" onClick={() => setIsCreateOpen(true)} className="h-10 rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white">Add task</button>}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Open work" value={data?.summary.open ?? "--"} note="Manual and system tasks" tone="dark" />
        <AdminStatCard label="Due today" value={data?.summary.dueToday ?? "--"} note={formatDate(todayKey())} tone="warning" />
        <AdminStatCard label="Overdue" value={data?.summary.overdue ?? "--"} note="Needs scheduling attention" tone={data?.summary.overdue ? "critical" : "neutral"} />
        <AdminStatCard label="Completed" value={data?.summary.completed ?? "--"} note="Retained in history" tone="green" />
      </div>

      <div className="mt-4 grid gap-3 rounded-md border border-[#dbe6e3] bg-white p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
        <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" placeholder="Search task, client or assignee" aria-label="Search tasks" />
        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold" aria-label="Task status"><option value="active">Active work</option><option value="completed">Completed</option><option value="system">System alerts</option><option value="all">All tasks</option></select>
        <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold" aria-label="Task priority"><option value="">Any priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        <button type="button" onClick={() => setFilters({ priority: "", q: "", status: "active" })} className="h-10 rounded-md border border-[#d5e2de] bg-white px-4 text-[11px] font-black text-[#526560]">Reset</button>
      </div>

      {error ? <AdminError message={error} onRetry={loadTasks} /> : null}
      {message ? <div className="mt-4 rounded-md border border-[#cde9e1] bg-[#effaf7] p-3 text-[11px] font-bold text-[#087766]">{message}</div> : null}

      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
        <div className="flex items-center justify-between border-b border-[#e8efed] px-4 py-3"><div><h2 className="text-[13px] font-black">Work queue</h2><p className="mt-0.5 text-[10px] font-semibold text-[#71817d]">{filteredTasks.length} visible items</p></div><StatusPill tone="green">LIVE PRIORITY</StatusPill></div>
        <div className="hidden grid-cols-[minmax(220px,1.4fr)_minmax(140px,0.8fr)_100px_100px_110px_190px] gap-3 border-b border-[#edf2f1] bg-[#f8fbfa] px-4 py-2.5 text-[9px] font-black uppercase text-[#71817d] md:grid"><span>Task</span><span>Client</span><span>Due</span><span>Priority</span><span>Status</span><span /></div>
        {isLoading && !data ? <AdminSkeleton rows={7} /> : filteredTasks.length ? <div className="divide-y divide-[#edf2f1]">{filteredTasks.map((task) => (
          <div key={task.id} className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(220px,1.4fr)_minmax(140px,0.8fr)_100px_100px_110px_190px] md:items-center">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-[11px] font-black">{task.title}</p>{task.source === "system" ? <StatusPill tone="blue">System</StatusPill> : null}</div><p className="mt-1 line-clamp-2 text-[9px] font-semibold leading-4 text-[#71817d]">{task.note || task.type.replace(/_/g, " ")}</p></div>
            <div className="min-w-0">{task.clientId ? <Link href={`/admin/clients/${encodeURIComponent(task.clientId)}`} className="truncate text-[10px] font-black text-[#087766]">{task.clientName || "Client"}</Link> : <p className="truncate text-[10px] font-bold">{task.clientName || "Workspace"}</p>}<p className="mt-1 text-[9px] font-semibold text-[#71817d]">{task.clientPhone || task.assignedTo || "Unassigned"}</p></div>
            <p className={`text-[10px] font-black ${task.status !== "completed" && task.dueDate < todayKey() ? "text-[#b45139]" : "text-[#53645f]"}`}>{formatDate(task.dueDate)}</p>
            <StatusPill tone={priorityTone(task.priority)}>{task.priority}</StatusPill>
            <StatusPill tone={task.status === "completed" ? "green" : task.status === "in_progress" ? "blue" : "warning"}>{task.status.replace(/_/g, " ")}</StatusPill>
            <div className="flex flex-wrap gap-2">
              {task.source === "system" ? <Link href={task.actionHref || "/admin"} className="inline-flex h-8 items-center rounded-md bg-[#e7f6f2] px-3 text-[9px] font-black text-[#087766]">Resolve source</Link> : <>
                {task.status === "open" ? <button type="button" disabled={updatingTaskId === task.id} onClick={() => updateTask(task, "in_progress")} className="h-8 rounded-md border border-[#d5e2de] px-3 text-[9px] font-black disabled:opacity-50">Start</button> : null}
                {task.status !== "completed" ? <button type="button" disabled={updatingTaskId === task.id} onClick={() => updateTask(task, "completed")} className="h-8 rounded-md bg-[#0b6f61] px-3 text-[9px] font-black text-white disabled:opacity-50">Complete</button> : <button type="button" disabled={updatingTaskId === task.id} onClick={() => updateTask(task, "open")} className="h-8 rounded-md border border-[#d5e2de] px-3 text-[9px] font-black disabled:opacity-50">Reopen</button>}
              </>}
            </div>
          </div>
        ))}</div> : <AdminEmpty title="No tasks match" description="Change the filters or add a follow-up task." action={<button type="button" onClick={() => setIsCreateOpen(true)} className="text-[11px] font-black text-[#087766]">Add task</button>} />}
      </section>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-[#10231f]/38 p-0 sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.currentTarget === event.target && !isSaving) setIsCreateOpen(false); }}>
          <form data-testid="admin-task-dialog" onSubmit={createTask} className="max-h-[94vh] w-full overflow-y-auto rounded-t-md bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:max-w-[620px] sm:rounded-md" role="dialog" aria-modal="true" aria-labelledby="create-task-title">
            <div className="flex items-start justify-between gap-4 border-b border-[#e4ecea] p-5"><div><p className="text-[9px] font-black uppercase text-[#087766]">Manual workflow</p><h2 id="create-task-title" className="mt-1 text-[19px] font-black">Add task</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Assign a follow-up, report review, payment or general action.</p></div><button type="button" onClick={() => setIsCreateOpen(false)} disabled={isSaving} className="h-9 rounded-md border border-[#d5e2de] px-3 text-[10px] font-black disabled:opacity-50">Close</button></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="text-[9px] font-black uppercase text-[#71817d]">Task title</span><input required maxLength={160} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" placeholder="Call client for report follow-up" /></label>
              <label><span className="text-[9px] font-black uppercase text-[#71817d]">Client</span><select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold"><option value="">Workspace task</option>{data?.clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone}</option>)}</select></label>
              <label><span className="text-[9px] font-black uppercase text-[#71817d]">Due date</span><input required type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" /></label>
              <label><span className="text-[9px] font-black uppercase text-[#71817d]">Task type</span><select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AdminTaskType }))} className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold"><option value="follow_up">Follow-up</option><option value="report">Report</option><option value="critical">Critical value</option><option value="payment">Payment</option><option value="general">General</option></select></label>
              <label><span className="text-[9px] font-black uppercase text-[#71817d]">Priority</span><select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as AdminTaskPriority }))} className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label className="sm:col-span-2"><span className="text-[9px] font-black uppercase text-[#71817d]">Assign to</span><input value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))} className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" placeholder="Staff member or role" /></label>
              <label className="sm:col-span-2"><span className="text-[9px] font-black uppercase text-[#71817d]">Notes</span><textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className="mt-1 min-h-24 w-full rounded-md border border-[#d5e2de] p-3 text-[12px] font-semibold" placeholder="Context, call instruction or next step" /></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e4ecea] p-4"><button type="button" onClick={() => setIsCreateOpen(false)} disabled={isSaving} className="h-10 rounded-md border border-[#d5e2de] px-4 text-[10px] font-black disabled:opacity-50">Cancel</button><button type="submit" disabled={isSaving} className="h-10 rounded-md bg-[#0b6f61] px-5 text-[10px] font-black text-white disabled:opacity-50">{isSaving ? "Creating..." : "Create task"}</button></div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}

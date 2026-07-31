"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, AdminStatCard, StatusPill } from "@/app/admin/_components/admin-ui";
import type { LabRole, WorkspaceAccess, WorkspaceRole, WorkspaceRoleAssignments } from "@/lib/vault-types";
import { defaultWorkspaceRoles, workspaceRoleLabel, workspaceRoleOptions } from "@/lib/workspace-roles";

type DashboardUser = {
  accountStatus?: "active" | "suspended";
  createdAt: string;
  email?: string;
  id: string;
  lastSeenAt?: string;
  name?: string;
  phone?: string;
  role: LabRole;
  sessionCount?: number;
  updatedAt: string;
  userId: string;
  workspaceAccess?: WorkspaceAccess[];
  workspaceRoles?: WorkspaceRoleAssignments;
};

const workspaceOptions: { label: string; value: WorkspaceAccess }[] = [
  { label: "Lab", value: "lab" },
  { label: "Nutrition", value: "nutrition" },
  { label: "Body composition", value: "body_composition" },
  { label: "Patient mobile app", value: "patient_app" },
];

function formatDate(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function AdminUsersPage() {
  const { session, status, user: signedInUser } = useAuth();
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [selected, setSelected] = useState<DashboardUser | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = useCallback(async () => {
    if (status === "loading" || !session?.access_token) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/lab-users", { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Users could not be loaded.");
      setUsers(result?.labUsers ?? []);
      setSelected((current) => current ? (result?.labUsers ?? []).find((item: DashboardUser) => item.userId === current.userId) ?? null : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Users could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((item) => {
      const matchesQuery = !needle || `${item.name} ${item.email} ${item.phone} ${item.role}`.toLowerCase().includes(needle);
      const itemStatus = item.accountStatus ?? "active";
      return matchesQuery && (statusFilter === "all" || itemStatus === statusFilter);
    });
  }, [query, statusFilter, users]);

  async function patchUser(payload: Record<string, unknown>, successMessage: string) {
    if (!selected) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/lab-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userId: selected.userId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "User could not be updated.");
      const nextUsers = result?.labUsers ?? [];
      setUsers(nextUsers);
      setSelected(nextUsers.find((item: DashboardUser) => item.userId === selected.userId) ?? null);
      setNewPassword("");
      setMessage(successMessage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "User could not be updated.");
    } finally {
      setIsSaving(false);
    }
  }

  const activeCount = users.filter((item) => (item.accountStatus ?? "active") === "active").length;
  const suspendedCount = users.filter((item) => item.accountStatus === "suspended").length;
  const sessionCount = users.reduce((sum, item) => sum + (item.sessionCount ?? 0), 0);
  const selectedIsOwner = selected?.email?.toLowerCase() === signedInUser?.email?.toLowerCase();

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Identity & access"
        title="Dashboard users"
        description="Control staff roles, workspace access, account status, passwords and active sessions from one place."
        actions={<Link href="/admin#dashboard-users" className="inline-flex h-10 items-center rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white">Add user</Link>}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Dashboard users" value={users.length} note="Owner and managed staff" />
        <AdminStatCard label="Active accounts" value={activeCount} note="Allowed to authenticate" tone="green" />
        <AdminStatCard label="Suspended" value={suspendedCount} note="Login access blocked" tone={suspendedCount ? "critical" : "neutral"} />
        <AdminStatCard label="Active sessions" value={sessionCount} note="Current signed-in sessions" tone="dark" />
      </div>

      {error ? <AdminError message={error} onRetry={loadUsers} /> : null}
      {message ? <p role="status" className="mt-4 rounded-md border border-[#cde9e1] bg-[#f1fbf8] p-3 text-[11px] font-bold text-[#087766]">{message}</p> : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="min-w-0 rounded-md border border-[#dbe6e3] bg-white">
          <div className="grid gap-2 border-b border-[#e8efed] p-3 sm:grid-cols-[1fr_150px_auto]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, mobile or role" className="h-10 rounded-md border border-[#d5e2de] px-3 text-[11px] font-bold outline-none focus:border-[#0b8c78]" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-[#d5e2de] px-3 text-[11px] font-bold">
              <option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option>
            </select>
            <button type="button" onClick={loadUsers} className="h-10 rounded-md border border-[#cdded9] px-4 text-[10px] font-black text-[#31504a]">Refresh</button>
          </div>
          {isLoading ? <AdminSkeleton rows={6} /> : filtered.length ? (
            <div className="divide-y divide-[#edf2f1]">
              {filtered.map((item) => (
                <button key={item.id} type="button" onClick={() => { setSelected(item); setMessage(""); setNewPassword(""); }} className={`grid w-full gap-2 p-4 text-left hover:bg-[#f7fbfa] sm:grid-cols-[minmax(0,1fr)_110px_150px_90px] sm:items-center ${selected?.userId === item.userId ? "bg-[#f0faf7]" : ""}`}>
                  <div className="min-w-0"><p className="truncate text-[12px] font-black">{item.name || item.email || "Dashboard user"}</p><p className="mt-1 truncate text-[10px] font-semibold text-[#71817d]">{item.email} · {item.phone || "No mobile"}</p></div>
                  <StatusPill tone={(item.accountStatus ?? "active") === "active" ? "green" : "critical"}>{item.accountStatus ?? "active"}</StatusPill>
                  <p className="text-[10px] font-bold text-[#53645f]">{(item.workspaceAccess ?? ["lab"]).map((workspace) => workspace === "body_composition" ? "Body" : workspace === "patient_app" ? "Mobile App" : workspace).join(", ")}</p>
                  <p className="text-[10px] font-bold text-[#53645f]">{item.sessionCount ?? 0} sessions</p>
                </button>
              ))}
            </div>
          ) : <AdminEmpty title="No matching users" description="Change the search or status filter, or create a new dashboard user." />}
        </section>

        <aside className="h-fit rounded-md border border-[#dbe6e3] bg-white xl:sticky xl:top-20">
          {selected ? (
            <div>
              <div className="border-b border-[#e8efed] p-4"><p className="text-[10px] font-black uppercase text-[#087766]">Edit access</p><h2 className="mt-1 truncate text-[16px] font-black">{selected.name || selected.email}</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Last active {formatDate(selected.lastSeenAt)}</p></div>
              <div className="space-y-4 p-4">
                <fieldset disabled={selectedIsOwner || isSaving}>
                  <legend className="text-[10px] font-black uppercase text-[#71817d]">App & dashboard access</legend>
                  <div className="mt-2 space-y-2">{workspaceOptions.map((option) => {
                    const checked = (selected.workspaceAccess ?? ["lab"]).includes(option.value);
                    return <label key={option.value} className="flex h-10 items-center gap-2 rounded-md border border-[#d5e2de] px-3 text-[10px] font-black"><input type="checkbox" checked={checked} onChange={(event) => setSelected((current) => current ? {
                      ...current,
                      workspaceAccess: event.target.checked ? [...(current.workspaceAccess ?? ["lab"]), option.value] : (current.workspaceAccess ?? ["lab"]).filter((workspace) => workspace !== option.value),
                      workspaceRoles: event.target.checked
                        ? { ...current.workspaceRoles, [option.value]: current.workspaceRoles?.[option.value] ?? defaultWorkspaceRoles[option.value] }
                        : Object.fromEntries(Object.entries(current.workspaceRoles ?? {}).filter(([workspace]) => workspace !== option.value)) as WorkspaceRoleAssignments,
                    } : current)} className="h-4 w-4 accent-[#0b8c78]" />{option.label}</label>;
                  })}</div>
                </fieldset>
                {(selected.workspaceAccess ?? ["lab"]).length ? (
                  <fieldset disabled={selectedIsOwner || isSaving}>
                    <legend className="text-[10px] font-black uppercase text-[#71817d]">Roles by selected access</legend>
                    <div className="mt-2 space-y-2">
                      {workspaceOptions.filter((option) => (selected.workspaceAccess ?? ["lab"]).includes(option.value)).map((option) => (
                        <label key={option.value} className="block">
                          <span className="text-[9px] font-black text-[#64736f]">{option.label}</span>
                          <select
                            value={selected.workspaceRoles?.[option.value] ?? (option.value === "lab" ? selected.role : defaultWorkspaceRoles[option.value])}
                            onChange={(event) => setSelected((current) => current ? {
                              ...current,
                              role: option.value === "lab" ? event.target.value as LabRole : current.role,
                              workspaceRoles: { ...current.workspaceRoles, [option.value]: event.target.value as WorkspaceRole },
                            } : current)}
                            className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] bg-white px-3 text-[11px] font-bold disabled:bg-[#edf2f1]"
                          >
                            {workspaceRoleOptions[option.value].map((role) => <option key={role} value={role}>{workspaceRoleLabel(role)}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : null}
                <button type="button" disabled={selectedIsOwner || isSaving || !(selected.workspaceAccess ?? []).length} onClick={() => patchUser({ role: selected.role, workspaceAccess: selected.workspaceAccess ?? ["lab"], workspaceRoles: selected.workspaceRoles }, "Roles and access updated.")} className="h-10 w-full rounded-md bg-[#0b6f61] text-[10px] font-black text-white disabled:opacity-50">Save roles & access</button>

                <div className="border-t border-[#e8efed] pt-4">
                  <label className="block"><span className="text-[10px] font-black uppercase text-[#71817d]">Temporary password</span><input type="password" minLength={6} disabled={selectedIsOwner || isSaving} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Minimum 6 characters" className="mt-1 h-10 w-full rounded-md border border-[#d5e2de] px-3 text-[11px] font-bold disabled:bg-[#edf2f1]" /></label>
                  <button type="button" disabled={selectedIsOwner || isSaving || newPassword.length < 6} onClick={() => patchUser({ password: newPassword }, "Password reset and old sessions revoked.")} className="mt-2 h-10 w-full rounded-md border border-[#0b6f61] text-[10px] font-black text-[#0b6f61] disabled:opacity-45">Reset password</button>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-[#e8efed] pt-4">
                  <button type="button" disabled={selectedIsOwner || isSaving || !(selected.sessionCount ?? 0)} onClick={() => patchUser({ revokeSessions: true }, "All active sessions revoked.")} className="h-10 rounded-md border border-[#d5e2de] text-[10px] font-black text-[#53645f] disabled:opacity-45">Revoke sessions</button>
                  <button type="button" disabled={selectedIsOwner || isSaving} onClick={() => patchUser({ accountStatus: selected.accountStatus === "suspended" ? "active" : "suspended" }, selected.accountStatus === "suspended" ? "Account reactivated." : "Account suspended and sessions revoked.")} className={`h-10 rounded-md text-[10px] font-black ${selected.accountStatus === "suspended" ? "bg-[#e8f8f2] text-[#087766]" : "bg-[#fff0ec] text-[#b45139]"} disabled:opacity-45`}>{selected.accountStatus === "suspended" ? "Reactivate" : "Suspend user"}</button>
                </div>
                {selectedIsOwner ? <p className="rounded-md bg-[#f4f7f6] p-3 text-[10px] font-bold leading-5 text-[#64736f]">Owner credentials and permissions are protected. Change the owner password through Railway secrets.</p> : null}
              </div>
            </div>
          ) : <AdminEmpty title="Select a user" description="Choose a dashboard user to manage access, security and sessions." />}
        </aside>
      </div>
    </AdminShell>
  );
}

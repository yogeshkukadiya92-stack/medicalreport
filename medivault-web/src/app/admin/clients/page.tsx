"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import type { AdminClientsPayload } from "@/lib/admin-types";
import { readNutritionAdminClients } from "@/lib/nutrition-admin";
import { AdminEmpty, AdminError, AdminPageHeader, AdminSkeleton, StatusPill } from "@/app/admin/_components/admin-ui";

type ClientFilters = { attention: string; link: string; q: string };

function initialFilters(): ClientFilters {
  if (typeof window === "undefined") return { attention: "", link: "", q: "" };
  const params = new URLSearchParams(window.location.search);
  return { attention: params.get("attention") || "", link: params.get("link") || "", q: params.get("q") || "" };
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function formatDate(value?: string) {
  if (!value) return "No report yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function AdminClientsPage() {
  const { session, status } = useAuth();
  const [filters, setFilters] = useState<ClientFilters>(initialFilters);
  const [data, setData] = useState<AdminClientsPayload | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [nutritionPhones, setNutritionPhones] = useState<Set<string>>(new Set());

  const loadClients = useCallback(async (nextFilters: ClientFilters, nextPage = 1) => {
    if (status === "loading") return;
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(nextPage), pageSize: "25" });
    Object.entries(nextFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    try {
      const response = await fetch(`/api/admin/clients?${params.toString()}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Clients could not be loaded.");
      setData(result as AdminClientsPayload);
      setPage(nextPage);
      window.history.replaceState(null, "", params.toString() ? `/admin/clients?${params.toString()}` : "/admin/clients");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Clients could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, status]);

  useEffect(() => { loadClients(filters, 1); }, [loadClients]);
  useEffect(() => {
    setNutritionPhones(new Set(readNutritionAdminClients().map((client) => normalizePhone(client.phone || "")).filter(Boolean)));
  }, []);

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();
    loadClients(filters, 1);
  }

  function clearFilters() {
    const next = { attention: "", link: "", q: "" };
    setFilters(next);
    loadClients(next, 1);
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 25)));

  return (
    <AdminShell>
      <AdminPageHeader
        eyebrow="Client management"
        title="Client CRM"
        description="Search every lab client, see patient-app linkage, report risk, nutrition connection and open work before opening the complete 360 profile."
        actions={<Link href="/lab/clients" className="inline-flex h-10 items-center rounded-md bg-[#0b6f61] px-4 text-[11px] font-black text-white">Add or edit client</Link>}
      />

      <form onSubmit={applyFilters} className="mt-5 grid gap-3 rounded-md border border-[#dbe6e3] bg-white p-4 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto]">
        <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] px-3 text-[12px] font-bold" placeholder="Name or mobile number" aria-label="Search clients" />
        <select value={filters.link} onChange={(event) => setFilters((current) => ({ ...current, link: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold" aria-label="Patient app status">
          <option value="">Any app status</option><option value="linked">App linked</option><option value="unlinked">Not linked</option>
        </select>
        <select value={filters.attention} onChange={(event) => setFilters((current) => ({ ...current, attention: event.target.value }))} className="h-10 rounded-md border border-[#d5e2de] bg-white px-3 text-[12px] font-bold" aria-label="Attention filter">
          <option value="">Any attention</option><option value="flagged">Flagged reports</option><option value="tasks">Open tasks</option>
        </select>
        <button type="submit" disabled={isLoading} className="h-10 rounded-md bg-[#143d36] px-4 text-[11px] font-black text-white disabled:opacity-55">Apply</button>
        <button type="button" onClick={clearFilters} className="h-10 rounded-md border border-[#d5e2de] bg-white px-4 text-[11px] font-black text-[#526560]">Clear</button>
      </form>

      {error ? <AdminError message={error} onRetry={() => loadClients(filters, page)} /> : null}

      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
        <div className="flex items-center justify-between border-b border-[#e8efed] px-4 py-3">
          <div><h2 className="text-[13px] font-black">Client directory</h2><p className="mt-0.5 text-[10px] font-semibold text-[#71817d]">{data ? `${data.total.toLocaleString("en-IN")} matching clients` : "Loading live clients"}</p></div>
          <StatusPill tone="green">LIVE LAB DATA</StatusPill>
        </div>
        <div className="hidden grid-cols-[minmax(180px,1.3fr)_110px_100px_120px_120px_90px] gap-3 border-b border-[#edf2f1] bg-[#f8fbfa] px-4 py-2.5 text-[9px] font-black uppercase text-[#71817d] md:grid">
          <span>Client</span><span>Reports</span><span>Attention</span><span>Patient app</span><span>Last report</span><span />
        </div>
        {isLoading && !data ? <AdminSkeleton rows={6} /> : data?.clients.length ? (
          <div className="divide-y divide-[#edf2f1]">
            {data.clients.map((client) => {
              const hasNutrition = nutritionPhones.has(normalizePhone(client.phone));
              return (
                <div key={client.id} className="grid gap-3 px-4 py-3.5 hover:bg-[#f8fbfa] md:grid-cols-[minmax(180px,1.3fr)_110px_100px_120px_120px_90px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="truncate text-[12px] font-black text-[#16302b]">{client.name}</p>{hasNutrition ? <StatusPill tone="blue">Nutrition</StatusPill> : null}</div>
                    <p className="mt-1 truncate text-[10px] font-semibold text-[#71817d]">{client.phone} · {client.gender || "Gender not set"} · {client.age ? `${client.age} years` : "Age not set"}</p>
                  </div>
                  <div><p className="text-[12px] font-black">{client.reportCount}</p><p className="text-[9px] font-semibold text-[#7a8985]">{client.claimedReports} in app</p></div>
                  <div className="flex flex-wrap gap-1"><StatusPill tone={client.abnormalReports ? "critical" : "green"}>{client.abnormalReports ? `${client.abnormalReports} flagged` : "Clear"}</StatusPill>{client.openTasks ? <StatusPill tone="warning">{client.openTasks} tasks</StatusPill> : null}</div>
                  <StatusPill tone={client.appLinked ? "green" : "warning"}>{client.appLinked ? "Linked" : "Not linked"}</StatusPill>
                  <p className="text-[10px] font-bold text-[#53645f]">{formatDate(client.latestReportDate)}</p>
                  <Link href={`/admin/clients/${encodeURIComponent(client.id)}`} className="inline-flex h-8 items-center justify-center rounded-md bg-[#e6f6f1] px-3 text-[10px] font-black text-[#087766]">View 360</Link>
                </div>
              );
            })}
          </div>
        ) : <AdminEmpty title="No clients found" description="Change the filters or add a client from lab operations." action={<button type="button" onClick={clearFilters} className="text-[11px] font-black text-[#087766]">Reset filters</button>} />}
      </section>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold text-[#71817d]">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1 || isLoading} onClick={() => loadClients(filters, page - 1)} className="h-9 rounded-md border border-[#d5e2de] bg-white px-3 text-[10px] font-black disabled:opacity-45">Previous</button>
          <button type="button" disabled={page >= totalPages || isLoading} onClick={() => loadClients(filters, page + 1)} className="h-9 rounded-md border border-[#d5e2de] bg-white px-3 text-[10px] font-black disabled:opacity-45">Next</button>
        </div>
      </div>
    </AdminShell>
  );
}

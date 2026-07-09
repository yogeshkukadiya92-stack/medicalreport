"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import type { LabClient } from "@/lib/vault-types";

const emptyForm = { age: "", countryCode: "+91", gender: "", name: "", phone: "" };

export default function LabClientsPage() {
  const { isConfigured, session, status } = useAuth();
  const [clients, setClients] = useState<LabClient[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadClients(nextQuery = query) {
    if (!isConfigured || status === "loading") return;
    if (!session?.access_token) return;
    try {
      const response = await fetch(`/api/lab/clients?q=${encodeURIComponent(nextQuery)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        setClients(result?.clients ?? []);
      } else {
        setError(result?.error ?? "Clients could not be loaded.");
      }
    } catch {
      setError("Clients could not be loaded. Refresh after sign-in, or allow this site in any browser content blocker.");
    }
  }

  useEffect(() => {
    loadClients("");
  }, [isConfigured, session?.access_token, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) return;
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/lab/clients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      setIsSaving(false);

      if (!response.ok) {
        setError(result?.error ?? "Client could not be saved.");
        return;
      }

      setMessage(result?.created ? "Client added." : "Client updated.");
      setForm(emptyForm);
      loadClients(query);
    } catch {
      setIsSaving(false);
      setError("Client could not be saved. Refresh after sign-in and try again.");
    }
  }

  function editClient(client: LabClient) {
    setForm({
      age: client.age ? String(client.age) : "",
      countryCode: client.countryCode ?? "+91",
      gender: client.gender ?? "",
      name: client.name,
      phone: client.phone,
    });
    setMessage("");
    setError("");
  }

  return (
    <LabShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section className="w-full rounded-lg border border-[#e2ebe8] bg-white p-4 lg:max-w-[380px]">
          <h1 className="text-[22px] font-black text-[#101c1c]">Clients</h1>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-[12px] font-bold text-[#52605d]">Client name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                placeholder="Client full name"
              />
            </label>
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Code</span>
                <input
                  value={form.countryCode}
                  onChange={(event) => setForm((current) => ({ ...current, countryCode: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                  placeholder="+91"
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Mobile number</span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                  placeholder="98765 43210"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Age</span>
                <input
                  type="number"
                  min="0"
                  value={form.age}
                  onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                />
              </label>
              <label className="block">
                <span className="text-[12px] font-bold text-[#52605d]">Gender</span>
                <input
                  value={form.gender}
                  onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                  placeholder="Optional"
                />
              </label>
            </div>
            {message ? <p className="rounded-lg bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</p> : null}
            {error ? <p className="rounded-lg bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</p> : null}
            <button disabled={isSaving} className="h-11 w-full rounded-lg bg-[#0a7d6e] text-[13px] font-bold text-white disabled:opacity-60">
              {isSaving ? "Saving..." : "Save client"}
            </button>
          </form>
        </section>

        <section className="min-w-0 flex-1 rounded-lg border border-[#e2ebe8] bg-white">
          <div className="border-b border-[#edf3f1] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[18px] font-black text-[#102323]">Client master</h2>
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full min-w-[220px] rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
                  placeholder="Search name or phone"
                />
                <button onClick={() => loadClients(query)} className="h-10 rounded-lg border border-[#dce9e5] px-4 text-[12px] font-bold text-[#087766]">
                  Search
                </button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {clients.length ? (
              clients.map((client) => (
                <div key={client.id} className="grid gap-3 p-4 md:grid-cols-[1fr_150px_120px_170px] md:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-[#162523]">{client.name}</p>
                    <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{client.countryCode ?? "+91"} {client.phone}</p>
                  </div>
                  <span className="text-[12px] font-bold text-[#52605d]">{client.gender || "Gender not set"}</span>
                  <span className="text-[12px] font-bold text-[#52605d]">{client.age ? `${client.age} years` : "Age not set"}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/lab/create?clientId=${encodeURIComponent(client.id)}`} className="flex h-9 items-center justify-center rounded-md bg-[#0a7d6e] text-[12px] font-bold text-white">
                      Report
                    </Link>
                    <button onClick={() => editClient(client)} className="h-9 rounded-md bg-[#e8f7f2] text-[12px] font-bold text-[#087766]">
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 text-[13px] font-bold text-[#6f7f7c]">No clients found.</div>
            )}
          </div>
        </section>
      </div>
    </LabShell>
  );
}

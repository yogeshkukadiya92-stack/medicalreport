"use client";

import { FormEvent, useEffect, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import type { LabProfile, LabRole } from "@/lib/vault-types";

const emptyForm = { address: "", name: "", phone: "" };

export default function LabSettingsPage() {
  const { isConfigured, session, status } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [lab, setLab] = useState<LabProfile | null>(null);
  const [role, setRole] = useState<LabRole>("lab_staff");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadSettings() {
    if (!isConfigured || status === "loading") return;
    if (!session?.access_token) return;
    try {
      const response = await fetch("/api/lab/settings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Settings could not be loaded.");
        return;
      }
      setLab(result?.lab ?? null);
      setRole(result?.role ?? "lab_staff");
      setForm({
        address: result?.lab?.address ?? "",
        name: result?.lab?.name ?? "",
        phone: result?.lab?.phone ?? "",
      });
    } catch {
      setError("Settings could not be loaded. Refresh after sign-in, or allow this site in any browser content blocker.");
    }
  }

  useEffect(() => {
    loadSettings();
  }, [isConfigured, session?.access_token, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) return;
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/lab/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      setIsSaving(false);

      if (!response.ok) {
        setError(result?.error ?? "Settings could not be saved.");
        return;
      }

      setLab(result?.lab ?? null);
      setMessage("Lab settings saved.");
    } catch {
      setIsSaving(false);
      setError("Settings could not be saved. Refresh after sign-in and try again.");
    }
  }

  return (
    <LabShell>
      <div>
        <p className="text-[13px] font-bold text-[#087766]">Lab profile</p>
        <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Settings</h1>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-lg border border-[#e2ebe8] bg-white p-4">
          <h2 className="text-[16px] font-black text-[#102323]">Profile</h2>
          <label className="mt-4 block">
            <span className="text-[12px] font-bold text-[#52605d]">Lab name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-[12px] font-bold text-[#52605d]">Phone</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-[12px] font-bold text-[#52605d]">Address</span>
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="mt-2 min-h-[96px] w-full rounded-lg border border-[#dce9e5] p-3 text-[13px] font-bold"
            />
          </label>
          {message ? <p className="mt-3 rounded-lg bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</p> : null}
          {error ? <p className="mt-3 rounded-lg bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</p> : null}
          <button disabled={isSaving || role !== "lab_admin"} className="mt-4 h-11 w-full rounded-lg bg-[#0a7d6e] text-[13px] font-bold text-white disabled:opacity-60">
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </form>

        <section className="rounded-lg border border-[#e2ebe8] bg-white p-4">
          <h2 className="text-[16px] font-black text-[#102323]">Current lab</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#f7fbfa] p-4">
              <p className="text-[12px] font-bold text-[#6f7f7c]">Name</p>
              <p className="mt-2 text-[15px] font-black text-[#102323]">{lab?.name ?? "--"}</p>
            </div>
            <div className="rounded-lg bg-[#f7fbfa] p-4">
              <p className="text-[12px] font-bold text-[#6f7f7c]">Role</p>
              <p className="mt-2 text-[15px] font-black text-[#102323]">{role}</p>
            </div>
            <div className="rounded-lg bg-[#f7fbfa] p-4">
              <p className="text-[12px] font-bold text-[#6f7f7c]">Lab ID</p>
              <p className="mt-2 break-all text-[13px] font-black text-[#102323]">{lab?.id ?? "--"}</p>
            </div>
            <div className="rounded-lg bg-[#f7fbfa] p-4">
              <p className="text-[12px] font-bold text-[#6f7f7c]">Owner</p>
              <p className="mt-2 break-all text-[13px] font-black text-[#102323]">{lab?.ownerUserId ?? "--"}</p>
            </div>
          </div>
        </section>
      </div>
    </LabShell>
  );
}

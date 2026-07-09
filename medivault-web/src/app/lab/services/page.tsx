"use client";

import { FormEvent, useEffect, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import type { LabService } from "@/lib/vault-types";

const emptyForm = {
  description: "",
  durationMinutes: "30",
  homeCollection: true,
  name: "",
  price: "",
  sampleType: "",
};

export default function LabServicesPage() {
  const { isConfigured, session, status } = useAuth();
  const [services, setServices] = useState<LabService[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadServices() {
    if (!isConfigured || status === "loading" || !session?.access_token) return;
    try {
      const response = await fetch("/api/lab/services", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Services could not be loaded.");
        return;
      }
      setServices(result?.services ?? []);
    } catch {
      setError("Services could not be loaded. Refresh after sign-in and try again.");
    }
  }

  useEffect(() => {
    loadServices();
  }, [isConfigured, session?.access_token, status]);

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/lab/services", {
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
        setError(result?.error ?? "Service could not be saved.");
        return;
      }
      setForm(emptyForm);
      setMessage("Service added.");
      setServices((current) => [result.service, ...current]);
    } catch {
      setIsSaving(false);
      setError("Service could not be saved. Try again.");
    }
  }

  async function toggleService(service: LabService) {
    if (!session?.access_token) return;
    const next = { ...service, active: !service.active };
    setServices((current) => current.map((item) => (item.id === service.id ? next : item)));
    const response = await fetch(`/api/lab/services/${service.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      setServices((current) => current.map((item) => (item.id === service.id ? service : item)));
      setError("Service status could not be updated.");
    }
  }

  return (
    <LabShell>
      <div>
        <p className="text-[13px] font-bold text-[#087766]">Booking catalog</p>
        <h1 className="mt-1 text-[28px] font-black text-[#101c1c]">Services</h1>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[420px_1fr]">
        <form onSubmit={createService} className="rounded-lg border border-[#e2ebe8] bg-white p-4">
          <h2 className="text-[16px] font-black text-[#102323]">Add service</h2>
          <label className="mt-4 block">
            <span className="text-[12px] font-bold text-[#52605d]">Service name</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="CBC, Full body checkup" />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-bold text-[#52605d]">Price</span>
              <input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="499" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-[#52605d]">Minutes</span>
              <input value={form.durationMinutes} onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" />
            </label>
          </div>
          <label className="mt-3 block">
            <span className="text-[12px] font-bold text-[#52605d]">Sample type</span>
            <input value={form.sampleType} onChange={(event) => setForm((current) => ({ ...current, sampleType: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="Blood, urine" />
          </label>
          <label className="mt-3 block">
            <span className="text-[12px] font-bold text-[#52605d]">Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-[86px] w-full rounded-lg border border-[#dce9e5] p-3 text-[13px] font-bold" />
          </label>
          <label className="mt-3 flex items-center gap-2 text-[13px] font-bold text-[#52605d]">
            <input type="checkbox" checked={form.homeCollection} onChange={(event) => setForm((current) => ({ ...current, homeCollection: event.target.checked }))} />
            Home collection available
          </label>
          {message ? <p className="mt-3 rounded-lg bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</p> : null}
          {error ? <p className="mt-3 rounded-lg bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</p> : null}
          <button disabled={isSaving} className="mt-4 h-11 w-full rounded-lg bg-[#0a7d6e] text-[13px] font-bold text-white disabled:opacity-60">
            {isSaving ? "Saving..." : "Add service"}
          </button>
        </form>

        <section className="rounded-lg border border-[#e2ebe8] bg-white">
          <div className="border-b border-[#edf3f1] p-4">
            <h2 className="text-[16px] font-black text-[#102323]">Live booking services</h2>
          </div>
          <div className="divide-y divide-[#edf3f1]">
            {services.length ? (
              services.map((service) => (
                <div key={service.id} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_130px] md:items-center">
                  <div>
                    <p className="text-[14px] font-black text-[#102323]">{service.name}</p>
                    <p className="mt-1 text-[12px] font-bold text-[#6f7f7c]">{service.sampleType || "Sample"} - {service.homeCollection ? "Home collection" : "Lab visit only"}</p>
                    {service.description ? <p className="mt-2 text-[12px] leading-5 text-[#65716f]">{service.description}</p> : null}
                  </div>
                  <p className="text-[13px] font-black text-[#102323]">{service.price ? `Rs. ${service.price}` : "Price not set"}</p>
                  <button onClick={() => toggleService(service)} className={`h-10 rounded-lg text-[12px] font-bold ${service.active ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#eef1f0] text-[#52605d]"}`}>
                    {service.active ? "Active" : "Inactive"}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-5 text-[13px] font-bold text-[#6f7f7c]">No services added yet.</div>
            )}
          </div>
        </section>
      </div>
    </LabShell>
  );
}

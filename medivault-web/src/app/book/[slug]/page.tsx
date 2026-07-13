"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CountryPhoneInput } from "@/components/country-phone-input";

type Panel = { category: string; id: string; name: string; price: number; tests: number };
type BookingPayload = {
  lab?: { address?: string; name?: string; phone?: string };
  panels?: Panel[];
  error?: string;
};

const emptyForm = { age: "", gender: "", patientName: "", patientPhone: "", paymentMode: "online", paymentReference: "", selectedPanel: "" };

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [data, setData] = useState<BookingPayload | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function loadBooking() {
      const response = await fetch(`/api/book/${encodeURIComponent(slug)}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Booking link could not be loaded.");
        return;
      }
      setData(result);
      setForm((current) => ({ ...current, selectedPanel: result?.panels?.[0]?.id ?? "" }));
    }
    loadBooking();
  }, [slug]);

  const selectedPanel = useMemo(
    () => data?.panels?.find((panel) => panel.id === form.selectedPanel) ?? data?.panels?.[0] ?? null,
    [data?.panels, form.selectedPanel],
  );

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slug) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/book/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Booking could not be created.");
      setMessage(`Booking confirmed. Accession ${result?.order?.accessionNumber || ""}. ${result?.invoice?.status === "paid" ? "Payment marked paid." : "Payment pending at lab."}`);
      setForm((current) => ({ ...emptyForm, selectedPanel: current.selectedPanel }));
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "Booking could not be created.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef6f3] px-4 py-6 text-[#102323]">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-[#d8e8e3] bg-white shadow-[0_18px_60px_rgba(7,38,32,0.12)]">
        <div className="bg-[#064e3b] p-5 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8ff4df]">Online lab booking</p>
          <h1 className="mt-2 text-[28px] font-black">{data?.lab?.name || "MediVault Lab"}</h1>
          <p className="mt-1 text-[13px] font-semibold text-white/70">{data?.lab?.address || "Book a report slot and share payment reference online."}</p>
        </div>

        <form onSubmit={submitBooking} className="grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-[11px] font-black uppercase text-[#65716f]">Patient name</span>
              <input required value={form.patientName} onChange={(event) => setForm((current) => ({ ...current, patientName: event.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="Full name" />
            </label>
            <CountryPhoneInput
              label="Mobile"
              required
              value={form.patientPhone}
              onChange={(patientPhone) => setForm((current) => ({ ...current, patientPhone }))}
              size="sm"
              inputClassName="h-11 rounded-md text-[13px]"
              selectClassName="h-11 rounded-md text-[11px]"
            />
            <label>
              <span className="text-[11px] font-black uppercase text-[#65716f]">Age</span>
              <input value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="Optional" />
            </label>
            <label>
              <span className="text-[11px] font-black uppercase text-[#65716f]">Gender</span>
              <input value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder="Optional" />
            </label>
          </div>

          <section className="rounded-md border border-[#dce9e5]">
            <div className="border-b border-[#edf3f1] p-3">
              <p className="text-[12px] font-black text-[#102323]">Select report panel</p>
              <p className="mt-1 text-[11px] font-semibold text-[#65716f]">Amount is saved into lab accounting after booking.</p>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {(data?.panels ?? []).map((panel) => (
                <button key={panel.id} type="button" onClick={() => setForm((current) => ({ ...current, selectedPanel: panel.id }))} className={`rounded-md border p-3 text-left ${form.selectedPanel === panel.id ? "border-[#0a7d6e] bg-[#e8f7f2]" : "border-[#e2ebe8] bg-white"}`}>
                  <p className="text-[13px] font-black">{panel.name}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#65716f]">{panel.tests} parameters · {panel.category}</p>
                  <p className="mt-2 text-[18px] font-black text-[#0a7d6e]">₹{panel.price}</p>
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-3 rounded-md border border-[#dce9e5] bg-[#f8fbfa] p-3 sm:grid-cols-2">
            <label>
              <span className="text-[11px] font-black uppercase text-[#65716f]">Payment</span>
              <select value={form.paymentMode} onChange={(event) => setForm((current) => ({ ...current, paymentMode: event.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dce9e5] px-3 text-[13px] font-bold">
                <option value="online">Paid online</option>
                <option value="pay_at_lab">Pay at lab</option>
              </select>
            </label>
            <label>
              <span className="text-[11px] font-black uppercase text-[#65716f]">Payment reference</span>
              <input value={form.paymentReference} onChange={(event) => setForm((current) => ({ ...current, paymentReference: event.target.value }))} className="mt-1 h-11 w-full rounded-md border border-[#dce9e5] px-3 text-[13px] font-bold" placeholder={form.paymentMode === "online" ? "UPI / transaction ID" : "Optional"} />
            </label>
            <div className="rounded-md bg-[#0d2f2a] p-3 text-white sm:col-span-2">
              <p className="text-[10px] font-black uppercase text-[#8ff4df]">Payable amount</p>
              <p className="mt-1 text-[26px] font-black">₹{selectedPanel?.price ?? 0}</p>
              <p className="text-[11px] font-semibold text-white/60">{selectedPanel?.name || "Select a panel"}</p>
            </div>
          </div>

          {error ? <p className="rounded-md bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</p> : null}
          {message ? <p className="rounded-md bg-[#eaf9f2] p-3 text-[12px] font-bold text-[#087766]">{message}</p> : null}

          <button disabled={isSaving || !selectedPanel} className="h-12 rounded-md bg-[#0a7d6e] text-[14px] font-black text-white disabled:opacity-60">
            {isSaving ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      </section>
    </main>
  );
}

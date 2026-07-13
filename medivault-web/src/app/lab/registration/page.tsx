"use client";

import { useEffect, useMemo, useState } from "react";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";

type Panel = { category: string; id: string; name: string; price: number; tests: number };
type Booking = { accessionNumber?: string; createdAt?: string; patientName?: string; patientPhone?: string; stage?: string; testName?: string };
type Payload = { bookings: Booking[]; bookingUrl: string; lab?: { name?: string }; panels: Panel[] };

function absoluteBookingUrl(path: string) {
  if (typeof window === "undefined" || !path) return path;
  return `${window.location.origin}${path}`;
}

export default function LabRegistrationPage() {
  const { session, status } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "loading" || !session?.access_token) return;
    async function loadRegistration() {
      const response = await fetch("/api/lab/registration", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Registration link could not be loaded.");
        return;
      }
      setData(result);
    }
    loadRegistration();
  }, [session?.access_token, status]);

  const publicUrl = useMemo(() => absoluteBookingUrl(data?.bookingUrl ?? ""), [data?.bookingUrl]);

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard?.writeText(publicUrl).catch(() => null);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <LabShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#087766]">Online registration</p>
          <h1 className="mt-1 text-[28px] font-black text-[#17222b]">Registration link</h1>
          <p className="mt-1 text-[12px] font-semibold text-[#65716f]">Share this link so clients can book reports online and submit payment details.</p>
        </div>
        <button type="button" onClick={copyLink} className="h-10 rounded-md bg-[#0d5c46] px-4 text-[12px] font-black text-white">{copied ? "Copied" : "Copy booking link"}</button>
      </header>

      {error ? <div className="mt-4 rounded-md bg-[#fff0ec] p-3 text-[12px] font-bold text-[#ba563d]">{error}</div> : null}

      <section className="mt-4 rounded-md border border-[#dbe6e3] bg-white p-4">
        <p className="text-[10px] font-black uppercase text-[#71817d]">Public booking URL</p>
        <div className="mt-2 flex flex-col gap-2 rounded-md border border-[#dce9e5] bg-[#f8fbfa] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-all text-[13px] font-black text-[#102323]">{publicUrl || "Loading booking link..."}</p>
          {publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#b8d4cc] px-3 text-[11px] font-black text-[#0d5c46]">Open</a> : null}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e7efed] p-4"><h2 className="text-[15px] font-black">Bookable panels</h2><p className="mt-1 text-[11px] font-semibold text-[#74837f]">Prices shown to patients on the booking page.</p></div>
          <div className="divide-y divide-[#edf3f1]">
            {(data?.panels ?? []).map((panel) => (
              <div key={panel.id} className="grid grid-cols-[1fr_80px] gap-3 p-3">
                <div><p className="text-[12px] font-black">{panel.name}</p><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{panel.tests} parameters · {panel.category}</p></div>
                <p className="text-right text-[16px] font-black text-[#0d5c46]">₹{panel.price}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e7efed] p-4"><h2 className="text-[15px] font-black">Recent online bookings</h2><p className="mt-1 text-[11px] font-semibold text-[#74837f]">These bookings also appear in the sample queue.</p></div>
          <div className="divide-y divide-[#edf3f1]">
            {data?.bookings?.length ? data.bookings.map((booking, index) => (
              <div key={`${booking.accessionNumber}-${index}`} className="grid gap-2 p-3 sm:grid-cols-[110px_1fr_110px] sm:items-center">
                <p className="font-mono text-[11px] font-black text-[#17222b]">{booking.accessionNumber}</p>
                <div><p className="text-[12px] font-black">{booking.patientName}</p><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{booking.patientPhone} · {booking.testName}</p></div>
                <span className="w-fit rounded bg-[#eaf9f2] px-2 py-1 text-[9px] font-black text-[#087766]">{booking.stage || "ordered"}</span>
              </div>
            )) : <div className="p-5 text-[12px] font-bold text-[#74837f]">No online bookings yet.</div>}
          </div>
        </section>
      </div>
    </LabShell>
  );
}

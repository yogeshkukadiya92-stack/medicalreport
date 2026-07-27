"use client";

import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";

type Consent = { consent_type: string; consent_version: string; is_granted: boolean; updated_at: string };
type AccessEvent = { action: string; actor: string; createdAt: string; id: string; resource: string; type: string };

const consentDefinitions = [
  { id: "care_delivery", label: "Care delivery", note: "Allow your clinics to process reports for direct care." },
  { id: "provider_sharing", label: "Provider sharing", note: "Allow time-limited report links that you explicitly create." },
  { id: "analytics", label: "Health analytics", note: "Use normalized values to calculate your personal trends." },
  { id: "research", label: "De-identified research", note: "Optional use of de-identified data for health research." },
];

export default function PrivacyPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const [consentResponse, historyResponse] = await Promise.all([
      fetch("/api/consents", { cache: "no-store" }),
      fetch("/api/access-history", { cache: "no-store" }),
    ]);
    const consentResult = await consentResponse.json().catch(() => null);
    const historyResult = await historyResponse.json().catch(() => null);
    setConsents(Array.isArray(consentResult?.consents) ? consentResult.consents : []);
    setEvents(Array.isArray(historyResult?.events) ? historyResult.events : []);
  }

  useEffect(() => { load(); }, []);

  async function updateConsent(consentType: string, isGranted: boolean) {
    const response = await fetch("/api/consents", {
      body: JSON.stringify({ consent_type: consentType, consent_version: "2.0", is_granted: isGranted }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    setMessage(response.ok ? "Privacy preference saved." : "Preference could not be saved.");
    await load();
  }

  return (
    <MobileShell>
      <header className="border-b border-[#dce7e4] bg-white px-4 pb-4 pt-5">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#087766]">Patient control center</p>
        <h1 className="mt-1 text-[24px] font-black">Privacy & consent</h1>
        <p className="mt-1 text-[11px] font-semibold text-[#71817d]">Control permitted uses and review access to your health data.</p>
      </header>
      <div className="space-y-4 p-4">
        {message ? <p role="status" className="rounded-md bg-[#eaf9f2] p-3 text-[11px] font-bold text-[#087766]">{message}</p> : null}
        <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Consent preferences</h2></div>
          <div className="divide-y divide-[#edf2f1]">
            {consentDefinitions.map((definition) => {
              const consent = consents.find((item) => item.consent_type === definition.id);
              const checked = Boolean(consent?.is_granted);
              return <label key={definition.id} className="flex cursor-pointer items-start justify-between gap-3 p-4"><span><span className="block text-[12px] font-black">{definition.label}</span><span className="mt-1 block text-[10px] font-semibold text-[#71817d]">{definition.note}</span></span><input type="checkbox" checked={checked} onChange={(event) => updateConsent(definition.id, event.target.checked)} className="mt-1 h-5 w-5 accent-[#087766]" /></label>;
            })}
          </div>
        </section>
        <section className="overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
          <div className="border-b border-[#e8efed] p-4"><h2 className="text-[14px] font-black">Access history</h2><p className="mt-1 text-[10px] font-semibold text-[#71817d]">Sign-ins, consent changes and secure report views.</p></div>
          {events.length ? <div className="divide-y divide-[#edf2f1]">{events.map((event) => <div key={event.id} className="p-4"><div className="flex items-start justify-between gap-3"><p className="text-[11px] font-black capitalize">{event.action.replace(/_/g, " ")}</p><time className="text-[9px] font-bold text-[#71817d]">{new Date(event.createdAt).toLocaleString()}</time></div><p className="mt-1 text-[10px] font-semibold text-[#53645f]">{event.actor} · {event.resource}</p></div>)}</div> : <p className="p-4 text-[11px] font-semibold text-[#71817d]">No access activity recorded yet.</p>}
        </section>
      </div>
    </MobileShell>
  );
}

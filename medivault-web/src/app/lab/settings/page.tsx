"use client";

import { FormEvent, useEffect, useState } from "react";
import { CountryPhoneInput } from "@/components/country-phone-input";
import { LabShell } from "@/components/lab-shell";
import { useAuth } from "@/components/auth-provider";
import {
  defaultRegionPreferences,
  supportedCountries,
  supportedCurrencies,
  supportedLocales,
  supportedTimeZones,
  type DataRegion,
  type MeasurementSystem,
} from "@/lib/region-config";
import type { LabProfile, LabRole } from "@/lib/vault-types";

const emptyForm = {
  address: "",
  countryCode: defaultRegionPreferences.countryCode,
  currency: defaultRegionPreferences.currency,
  dataRegion: defaultRegionPreferences.dataRegion,
  locale: defaultRegionPreferences.locale,
  measurementSystem: defaultRegionPreferences.measurementSystem,
  name: "",
  phone: "",
  timeZone: defaultRegionPreferences.timeZone,
};

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
        countryCode: result?.lab?.countryCode ?? defaultRegionPreferences.countryCode,
        currency: result?.lab?.currency ?? defaultRegionPreferences.currency,
        dataRegion: result?.lab?.dataRegion ?? defaultRegionPreferences.dataRegion,
        locale: result?.lab?.locale ?? defaultRegionPreferences.locale,
        measurementSystem: result?.lab?.measurementSystem ?? defaultRegionPreferences.measurementSystem,
        name: result?.lab?.name ?? "",
        phone: result?.lab?.phone ?? "",
        timeZone: result?.lab?.timeZone ?? defaultRegionPreferences.timeZone,
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
          <CountryPhoneInput
            className="mt-3"
            label="Phone"
            value={form.phone}
            onChange={(phone) => setForm((current) => ({ ...current, phone }))}
            size="sm"
            inputClassName="h-11 text-[13px]"
            selectClassName="h-11 text-[12px]"
          />
          <label className="mt-3 block">
            <span className="text-[12px] font-bold text-[#52605d]">Address</span>
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="mt-2 min-h-[96px] w-full rounded-lg border border-[#dce9e5] p-3 text-[13px] font-bold"
            />
          </label>
          <div className="mt-4 border-t border-[#e2ebe8] pt-4">
            <h3 className="text-[13px] font-black text-[#102323]">Regional configuration</h3>
            <p className="mt-1 text-[10px] font-semibold leading-4 text-[#71817d]">Controls dates, billing, units and the declared storage region for this workspace.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-bold text-[#52605d]">Country</span>
                <select value={form.countryCode} onChange={(event) => {
                  const country = supportedCountries.find((item) => item.code === event.target.value);
                  if (!country) return;
                  setForm((current) => ({ ...current, countryCode: country.code, currency: country.currency, locale: country.locale, timeZone: country.timeZone }));
                }} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[12px] font-bold">
                  {supportedCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-[#52605d]">Language / locale</span>
                <select value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[12px] font-bold">
                  {supportedLocales.map((locale) => <option key={locale} value={locale}>{locale}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-[#52605d]">Timezone</span>
                <select value={form.timeZone} onChange={(event) => setForm((current) => ({ ...current, timeZone: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[12px] font-bold">
                  {supportedTimeZones.map((timeZone) => <option key={timeZone} value={timeZone}>{timeZone}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-[#52605d]">Billing currency</span>
                <select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[12px] font-bold">
                  {supportedCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-[#52605d]">Measurement system</span>
                <select value={form.measurementSystem} onChange={(event) => setForm((current) => ({ ...current, measurementSystem: event.target.value as MeasurementSystem }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[12px] font-bold">
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial display</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-[#52605d]">Data region</span>
                <select value={form.dataRegion} onChange={(event) => setForm((current) => ({ ...current, dataRegion: event.target.value as DataRegion }))} className="mt-2 h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3 text-[12px] font-bold">
                  <option value="india">India</option>
                  <option value="us">United States</option>
                  <option value="eu">European Union</option>
                  <option value="asia-pacific">Asia Pacific</option>
                </select>
              </label>
            </div>
          </div>
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
              <p className="text-[12px] font-bold text-[#6f7f7c]">Region</p>
              <p className="mt-2 text-[13px] font-black text-[#102323]">{lab?.countryCode ?? defaultRegionPreferences.countryCode} · {lab?.currency ?? defaultRegionPreferences.currency}</p>
              <p className="mt-1 text-[10px] font-semibold text-[#71817d]">{lab?.timeZone ?? defaultRegionPreferences.timeZone}</p>
            </div>
            <div className="rounded-lg bg-[#f7fbfa] p-4">
              <p className="text-[12px] font-bold text-[#6f7f7c]">Data residency</p>
              <p className="mt-2 text-[13px] font-black capitalize text-[#102323]">{(lab?.dataRegion ?? defaultRegionPreferences.dataRegion).replace("-", " ")}</p>
              <p className="mt-1 text-[10px] font-semibold text-[#71817d]">Policy preference; deployment must match.</p>
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

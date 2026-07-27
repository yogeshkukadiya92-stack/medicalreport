"use client";

import { useEffect, useState } from "react";

type Clinic = { id: string; name: string; role?: string };

export function ClinicSwitcher() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeClinicId, setActiveClinicId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/clinics", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        const rows = Array.isArray(result?.clinics) ? result.clinics : [];
        setClinics(rows);
        setActiveClinicId(result?.activeClinicId || rows[0]?.id || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function changeClinic(labId: string) {
    setActiveClinicId(labId);
    const response = await fetch("/api/auth/clinics", {
      body: JSON.stringify({ labId }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    if (response.ok) window.location.reload();
  }

  async function createClinic() {
    const name = window.prompt("New clinic name")?.trim();
    if (!name) return;
    const response = await fetch("/api/auth/clinics", {
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      window.alert(result?.error || "Clinic could not be created.");
      return;
    }
    await changeClinic(result.createdClinicId);
  }

  if (loading || !clinics.length) return null;
  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Active clinic"
        className="h-9 max-w-[190px] rounded-md border border-[#d7e4e0] bg-white px-2 text-[10px] font-black text-[#173a34]"
        value={activeClinicId}
        onChange={(event) => changeClinic(event.target.value)}
      >
        {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
      </select>
      <button type="button" onClick={createClinic} className="grid h-9 w-9 place-items-center rounded-md border border-[#d7e4e0] bg-white text-[18px] font-black text-[#087766]" aria-label="Create clinic">+</button>
    </div>
  );
}

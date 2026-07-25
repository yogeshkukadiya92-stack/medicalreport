"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BodyCompositionShell } from "@/components/body-composition-shell";
import { reportMetric } from "@/lib/body-composition";
import { useBodyData } from "../_components/use-body-data";

export default function BodyCompositionClientsPage() {
  const { data, error, isLoading } = useBodyData();
  const [search, setSearch] = useState("");
  const clients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.clients ?? []).flatMap((client) => {
      const reports = (data?.reports ?? []).filter((report) => report.clientId === client.id);
      const latest = reports[0];
      if (query && !`${client.name} ${client.phone}`.toLowerCase().includes(query)) return [];
      return [{ client, reports, latest }];
    }).sort((a, b) => b.reports.length - a.reports.length);
  }, [data, search]);

  return (
    <BodyCompositionShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0b806b]">Client registry</p><h1 className="mt-1 text-[24px] font-black">Body composition clients</h1><p className="mt-1 text-[11px] font-semibold text-[#697875]">Mobile-linked client profiles with complete scan history.</p></div><Link href="/body-composition/create" className="inline-flex h-9 items-center rounded-md bg-[#075b4e] px-4 text-[10px] font-black text-white">+ Add scan</Link></header>
      <div className="mt-4 rounded-md border border-[#dbe6e3] bg-white p-3"><input value={search} onChange={(event) => setSearch(event.target.value)} className="clinical-field max-w-md" placeholder="Search client name or mobile number" /></div>
      {error ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-[11px] font-bold text-[#ba563d]">{error}</p> : null}
      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
        <div className="hidden grid-cols-[1fr_90px_100px_100px_100px_120px] gap-3 border-b border-[#e7efed] bg-[#f8fbfa] px-4 py-2 text-[9px] font-black uppercase text-[#74837f] md:grid"><span>Client</span><span>Scans</span><span>Weight</span><span>BMI</span><span>Fat</span><span>Action</span></div>
        <div className="divide-y divide-[#e7efed]">{clients.length ? clients.map(({ client, reports, latest }) => {
          const weight = reportMetric(latest, ["Weight"]);
          const bmi = reportMetric(latest, ["BMI"]);
          const fat = reportMetric(latest, ["PBF", "Body Fat"]);
          return <div key={client.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_90px_100px_100px_100px_120px] md:items-center"><div><p className="text-[11px] font-black">{client.name}</p><p className="mt-1 text-[9px] font-semibold text-[#74837f]">{client.phone}{client.age ? ` · ${client.age} yrs` : ""}{client.gender ? ` · ${client.gender}` : ""}</p></div><span className="text-[11px] font-black">{reports.length}</span><span className="text-[11px] font-black">{weight ? `${weight.value} ${weight.unit}` : "--"}</span><span className="text-[11px] font-black">{bmi?.value || "--"}</span><span className="text-[11px] font-black">{fat ? `${fat.value} ${fat.unit}` : "--"}</span><div className="flex gap-2"><Link href={`/body-composition/reports?q=${encodeURIComponent(client.phone)}`} className="inline-flex h-8 items-center rounded border border-[#bdd4ce] px-2 text-[9px] font-black text-[#075b4e]">History</Link><Link href={`/body-composition/create?phone=${encodeURIComponent(client.phone)}`} className="inline-flex h-8 items-center rounded bg-[#075b4e] px-2 text-[9px] font-black text-white">New scan</Link></div></div>;
        }) : <div className="p-8 text-center"><p className="text-[12px] font-black">{isLoading ? "Loading clients..." : "No matching clients"}</p></div>}</div>
      </section>
    </BodyCompositionShell>
  );
}

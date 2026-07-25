"use client";

import { useMemo, useState } from "react";
import { BodyCompositionShell } from "@/components/body-composition-shell";
import { normalizedBodyMetric, numericBodyValue } from "@/lib/body-composition";
import { useBodyData } from "../_components/use-body-data";

const tracked = [
  ["Weight", ["weight"]],
  ["BMI", ["bmi"]],
  ["Fat %", ["pbf", "bodyfat"]],
  ["Muscle", ["skeletalmusclemass", "musclemass"]],
  ["Visceral fat", ["visceralfatlevel", "visceralfat"]],
  ["Body score", ["inbodyscore", "bodyscore"]],
] as const;

function pathFor(values: number[]) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return values.map((value, index) => {
    const x = values.length === 1 ? 50 : 5 + (index / (values.length - 1)) * 90;
    const y = 52 - ((value - min) / spread) * 42;
    return `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export default function BodyCompositionAnalyticsPage() {
  const { data, error, isLoading } = useBodyData("?status=published");
  const [clientId, setClientId] = useState("");
  const activeClientId = clientId || data?.clients[0]?.id || "";
  const reports = useMemo(() => (data?.reports ?? []).filter((report) => report.clientId === activeClientId).sort((a, b) => a.reportDate.localeCompare(b.reportDate)), [activeClientId, data?.reports]);
  const trends = useMemo(() => tracked.map(([label, keys]) => {
    const points = reports.flatMap((report) => {
      const marker = report.values.find((value) => (keys as readonly string[]).includes(normalizedBodyMetric(value.name)));
      const value = numericBodyValue(marker?.value ?? "");
      return value === null ? [] : [{ date: report.reportDate, status: marker?.status, unit: marker?.unit ?? "", value }];
    });
    const latest = points[points.length - 1];
    const previous = points[points.length - 2];
    return { label, points, latest, delta: latest && previous ? latest.value - previous.value : null, path: pathFor(points.map((point) => point.value)) };
  }), [reports]);

  return (
    <BodyCompositionShell>
      <header className="flex flex-col gap-3 border-b border-[#dbe6e3] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0b806b]">Longitudinal intelligence</p><h1 className="mt-1 text-[24px] font-black">Progress analytics</h1><p className="mt-1 text-[11px] font-semibold text-[#697875]">Published weight, fat, muscle and metabolic trends by client.</p></div><select value={activeClientId} onChange={(event) => setClientId(event.target.value)} className="clinical-field max-w-[280px]">{data?.clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone}</option>)}</select></header>
      {error ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-[11px] font-bold text-[#ba563d]">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {trends.map((trend) => <section key={trend.label} className="rounded-md border border-[#dbe6e3] bg-white p-4"><div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase text-[#74837f]">{trend.label}</p><p className="mt-2 text-[24px] font-black">{trend.latest ? `${trend.latest.value} ${trend.latest.unit}` : "--"}</p></div><span className={`rounded px-2 py-1 text-[9px] font-black ${trend.latest?.status === "Normal" ? "bg-[#eaf9f2] text-[#087766]" : "bg-[#fff7d8] text-[#8a6500]"}`}>{trend.points.length} readings</span></div><p className={`mt-1 text-[10px] font-black ${trend.delta !== null && trend.delta > 0 ? "text-[#ba563d]" : "text-[#0b806b]"}`}>{trend.delta === null ? "New baseline" : `${trend.delta >= 0 ? "+" : ""}${trend.delta.toFixed(1)} since previous`}</p><svg viewBox="0 0 100 58" className="mt-3 h-[90px] w-full" role="img" aria-label={`${trend.label} trend`}><line x1="5" y1="54" x2="95" y2="54" stroke="#dbe6e3" strokeWidth="1" /><path d={trend.path} fill="none" stroke="#0b806b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{trend.points.map((point, index) => { const count = trend.points.length; const x = count === 1 ? 50 : 5 + (index / (count - 1)) * 90; const values = trend.points.map((item) => item.value); const min = Math.min(...values); const max = Math.max(...values); const y = 52 - ((point.value - min) / (max - min || 1)) * 42; return <circle key={`${point.date}-${index}`} cx={x} cy={y} r="2.5" fill="#55d6b3" stroke="#075b4e" strokeWidth="1" />; })}</svg></section>)}
      </div>
      <section className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-white"><div className="border-b border-[#e7efed] p-4"><h2 className="text-[14px] font-black">Scan timeline</h2><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{reports.length} verified scans for selected client</p></div><div className="divide-y divide-[#e7efed]">{reports.length ? reports.slice().reverse().map((report) => <div key={report.id} className="grid gap-2 p-4 sm:grid-cols-[110px_1fr_110px]"><span className="text-[10px] font-black">{report.reportDate}</span><p className="text-[10px] font-semibold text-[#52605d]">{report.summary}</p><span className="text-[9px] font-black text-[#0b806b]">{report.parameters} parameters</span></div>) : <p className="p-6 text-center text-[11px] font-semibold text-[#74837f]">{isLoading ? "Loading analytics..." : "Publish at least one scan to unlock trends."}</p>}</div></section>
    </BodyCompositionShell>
  );
}

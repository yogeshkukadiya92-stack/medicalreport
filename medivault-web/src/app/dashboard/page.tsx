"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";
import { SignOutButton } from "@/components/sign-out-button";
import { calculateHealthScore } from "@/lib/health-score";

const filters = ["All", "Blood", "Diabetes", "Thyroid", "Liver", "Kidney"] as const;
type FilterName = (typeof filters)[number];

type TimelineResult = {
  category: string;
  date: string;
  id: string;
  lab: string;
  name: string;
  range: string;
  reportId: string;
  reportTitle: string;
  status: "Normal" | "High" | "Low" | "Watch";
  timestamp: number;
  value: string;
};

function reportTimestamp(report: { createdAt?: number; date: string }) {
  if (typeof report.createdAt === "number" && Number.isFinite(report.createdAt)) return report.createdAt;
  const parsed = Date.parse(report.date);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numericValue(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function testGroup(item: TimelineResult) {
  const source = `${item.category} ${item.reportTitle} ${item.name}`.toLowerCase();
  if (/thyroid|tsh|\bt3\b|\bt4\b/.test(source)) return "Thyroid";
  if (/diabetes|glucose|hba1c|sugar|insulin/.test(source)) return "Diabetes";
  if (/liver|bilirubin|sgpt|sgot|alt|ast|albumin/.test(source)) return "Liver";
  if (/kidney|creatinine|urea|egfr|uric/.test(source)) return "Kidney";
  if (/blood|cbc|hemoglobin|rbc|wbc|platelet|hematocrit|mcv|mch/.test(source)) return "Blood";
  return "All";
}

function resultColors(status: TimelineResult["status"]) {
  if (status === "High" || status === "Low") {
    return { accent: "border-l-[#d9534f]", badge: "bg-[#fff0ec] text-[#b8443b]", icon: "bg-[#fff0ec] text-[#c84e43]", line: "#d9534f" };
  }
  if (status === "Watch") {
    return { accent: "border-l-[#d9a514]", badge: "bg-[#fff8dc] text-[#8a6500]", icon: "bg-[#fff8dc] text-[#a57800]", line: "#d9a514" };
  }
  return { accent: "border-l-[#15966f]", badge: "bg-[#eaf9f2] text-[#087766]", icon: "bg-[#eaf9f2] text-[#087766]", line: "#15966f" };
}

function shortDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(parsed));
}

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "MV";
}

function chartPath(points: Array<{ value: number }>) {
  if (!points.length) return "";
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return points.map((point, index) => {
    const x = points.length === 1 ? 160 : 24 + (index / (points.length - 1)) * 272;
    const y = 112 - ((point.value - min) / spread) * 70;
    return `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export default function Dashboard() {
  const { activeMember, familyMembers, reports, reportsForActiveMember, setActiveMemberId } = useAppData();
  const [filter, setFilter] = useState<FilterName>("All");
  const [selectedResult, setSelectedResult] = useState<TimelineResult | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const healthScore = calculateHealthScore(reportsForActiveMember);

  const allResults = useMemo(() => {
    const seen = new Set<string>();
    return reportsForActiveMember
      .flatMap((report) => report.markers.map((marker, index) => ({
        category: report.category || report.reportType || "Report",
        date: report.date,
        id: `${report.id}-${marker.name}-${index}`,
        lab: report.labName || report.lab || "Connected lab",
        name: marker.name,
        range: marker.range,
        reportId: report.id,
        reportTitle: report.title,
        status: marker.status,
        timestamp: reportTimestamp(report),
        value: marker.value,
      } satisfies TimelineResult)))
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter((item) => {
        const key = item.name.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [reportsForActiveMember]);

  const visibleResults = useMemo(
    () => allResults.filter((item) => filter === "All" || testGroup(item) === filter).slice(0, 12),
    [allResults, filter],
  );

  const selectedHistory = useMemo(() => {
    if (!selectedResult) return [];
    return reportsForActiveMember
      .flatMap((report) => report.markers
        .filter((marker) => marker.name.trim().toLowerCase() === selectedResult.name.trim().toLowerCase())
        .flatMap((marker) => {
          const value = numericValue(marker.value);
          return value === null ? [] : [{ date: report.date, status: marker.status, timestamp: reportTimestamp(report), value }];
        }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [reportsForActiveMember, selectedResult]);

  const attentionCount = allResults.filter((item) => item.status !== "Normal").length;
  const latestReport = reportsForActiveMember[0] ?? null;
  const connectedLabs = new Set(reportsForActiveMember.map((report) => report.labName || report.lab).filter(Boolean)).size;

  useEffect(() => {
    if (!selectedResult) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedResult(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedResult]);

  return (
    <MobileShell>
      <header className="border-b border-[#dce7e4] bg-white px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0d5c46] text-[11px] font-black text-white">{initials(activeMember?.name || "MediVault")}</span>
            <div className="min-w-0"><h1 className="truncate text-[20px] font-black text-[#17222b]">Unified Timeline</h1><p className="text-[10px] font-bold text-[#71817d]">All connected lab results</p></div>
          </div>
          <SignOutButton />
        </div>
      </header>

      <section className="px-4 pt-4">
        {activeMember ? (
          <div className="relative flex items-start justify-between gap-3">
            <div><h2 className="text-[18px] font-black text-[#17222b]">{activeMember.name}</h2><div className="mt-1 flex items-center gap-2"><span className="text-[10px] font-black uppercase text-[#61716d]">Health score</span><span className="text-[19px] font-black text-[#0d5c46]">{reportsForActiveMember.length ? healthScore : "--"}</span></div><p className="mt-0.5 text-[11px] font-semibold text-[#74837f]">Last synced: {latestReport ? shortDate(latestReport.date) : "No reports yet"}</p></div>
            <button type="button" onClick={() => setShowMembers((current) => !current)} className="flex h-9 items-center gap-1.5 rounded-md border border-[#cfded9] bg-white px-3 text-[11px] font-black text-[#263633]"><Icon name="family" className="h-4 w-4" />Switch</button>
            {showMembers ? <div className="absolute right-0 top-11 z-20 w-52 rounded-md border border-[#d7e4e0] bg-white p-1.5 shadow-[0_18px_44px_rgba(16,35,35,0.18)]">{familyMembers.map((member) => <button key={member.id} type="button" onClick={() => { setActiveMemberId(member.id); setShowMembers(false); setSelectedResult(null); }} className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[12px] font-bold ${member.id === activeMember.id ? "bg-[#eaf9f2] text-[#087766]" : "text-[#52605d] hover:bg-[#f5f8f7]"}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-[#eff5f3] text-[9px] font-black">{initials(member.name)}</span>{member.name}</button>)}</div> : null}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[#c5d8d3] bg-white p-4"><p className="text-[14px] font-black">Start your health timeline</p><Link href="/family" className="mt-3 inline-flex h-9 items-center rounded-md bg-[#0d5c46] px-3 text-[11px] font-black text-white">Add family member</Link></div>
        )}

        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`h-8 shrink-0 rounded-full border px-4 text-[11px] font-bold ${filter === item ? "border-[#0d5c46] bg-[#0d5c46] text-white" : "border-[#cfded9] bg-white text-[#52605d]"}`}>{item}</button>)}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-md bg-[#bdf5e8] px-3 py-3 text-[#0b5f52]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/70"><Icon name="trend" className="h-4 w-4" /></span>
          <div className="min-w-0"><p className="text-[9px] font-black uppercase">Live vault sync</p><p className="mt-0.5 truncate text-[12px] font-black">{reportsForActiveMember.length} reports from {connectedLabs} connected lab{connectedLabs === 1 ? "" : "s"}</p></div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3"><div><h2 className="text-[16px] font-black text-[#17222b]">Health results</h2><p className="mt-0.5 text-[10px] font-semibold text-[#74837f]">Tap any result to see its history</p></div>{attentionCount ? <span className="rounded bg-[#fff0ec] px-2 py-1 text-[10px] font-black text-[#b8443b]">{attentionCount} need attention</span> : <span className="rounded bg-[#eaf9f2] px-2 py-1 text-[10px] font-black text-[#087766]">All clear</span>}</div>

        {visibleResults.length ? (
          <div className="mt-3 divide-y divide-[#e7efed] overflow-hidden rounded-md border border-[#dbe6e3] bg-white">
            {visibleResults.map((item) => {
              const colors = resultColors(item.status);
              return <button key={item.id} type="button" onClick={() => setSelectedResult(item)} className={`grid w-full grid-cols-[38px_1fr_auto] items-center gap-3 border-l-[3px] ${colors.accent} px-3 py-3 text-left hover:bg-[#f8fbfa]`}>
                <span className={`grid h-9 w-9 place-items-center rounded-full ${colors.icon}`}><Icon name={item.status === "Normal" ? "trend" : "bell"} className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="flex items-center gap-2"><strong className="truncate text-[13px] text-[#17222b]">{item.name}</strong><span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${colors.badge}`}>{item.status}</span></span><span className="mt-1 block truncate text-[10px] font-semibold text-[#74837f]">{item.lab} · {shortDate(item.date)}</span></span>
                <span className="text-right"><strong className="block max-w-[100px] text-[14px] text-[#17222b]">{item.value}</strong><span className="mt-1 block text-[9px] font-semibold text-[#879590]">View trend</span></span>
              </button>;
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-dashed border-[#c5d8d3] bg-white p-5 text-center"><p className="text-[14px] font-black text-[#17222b]">No {filter === "All" ? "health" : filter.toLowerCase()} results</p><p className="mt-1 text-[11px] text-[#74837f]">Upload or connect a matching lab report to see data here.</p></div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link href="/reports" className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#dbe6e3] bg-white text-[10px] font-black text-[#52605d]"><Icon name="shield" className="h-4 w-4" />Secure share</Link>
          <Link href="/reports" className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#dbe6e3] bg-white text-[10px] font-black text-[#52605d]"><Icon name="reports" className="h-4 w-4" />Reports</Link>
          <Link href="/analytics" className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#dbe6e3] bg-white text-[10px] font-black text-[#52605d]"><Icon name="analytics" className="h-4 w-4" />Full history</Link>
        </div>
      </section>

      {selectedResult ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071b18]/45 px-0 backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedResult(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="result-history-title" className="max-h-[78dvh] w-full max-w-[430px] overflow-y-auto rounded-t-lg bg-white pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-24px_60px_rgba(7,27,24,0.22)]">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e7efed] bg-white px-4 py-4"><div><p className="text-[9px] font-black uppercase text-[#087766]">Result history</p><h2 id="result-history-title" className="mt-1 text-[19px] font-black text-[#17222b]">{selectedResult.name}</h2><p className="mt-1 text-[10px] font-semibold text-[#74837f]">{selectedResult.lab} · normalized timeline</p></div><button ref={closeButtonRef} type="button" aria-label="Close result history" onClick={() => setSelectedResult(null)} className="grid h-9 w-9 place-items-center rounded-md border border-[#dbe6e3] text-[20px] text-[#52605d]">×</button></div>
            <div className="p-4">
              <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold text-[#74837f]">Latest reading</p><p className="mt-1 text-[24px] font-black text-[#17222b]">{selectedResult.value}</p></div><span className={`rounded px-2 py-1 text-[10px] font-black ${resultColors(selectedResult.status).badge}`}>{selectedResult.status}</span></div>
              <div className="mt-4 overflow-hidden rounded-md border border-[#dbe6e3] bg-[#f8fbfa] p-3">
                <div className="flex items-center justify-between text-[9px] font-bold text-[#879590]"><span>{selectedHistory.length} reading{selectedHistory.length === 1 ? "" : "s"}</span><span>Reference {selectedResult.range || "not provided"}</span></div>
                <svg className="mt-2 h-[150px] w-full" viewBox="0 0 320 140" role="img" aria-label={`${selectedResult.name} past values graph`}>
                  <rect x="0" y="0" width="320" height="44" fill="#fff0ec" opacity="0.75" />
                  <rect x="0" y="44" width="320" height="52" fill="#eaf9f2" />
                  <rect x="0" y="96" width="320" height="44" fill="#fff8dc" opacity="0.8" />
                  {[24, 70, 116].map((y) => <line key={y} x1="16" y1={y} x2="304" y2={y} stroke="#cddbd7" strokeDasharray="4 5" />)}
                  <path d={chartPath(selectedHistory)} fill="none" stroke={resultColors(selectedResult.status).line} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {selectedHistory.map((point, index) => {
                    const values = selectedHistory.map((item) => item.value); const min = Math.min(...values); const max = Math.max(...values); const spread = max - min || 1; const x = selectedHistory.length === 1 ? 160 : 24 + (index / (selectedHistory.length - 1)) * 272; const y = 112 - ((point.value - min) / spread) * 70;
                    return <circle key={`${point.timestamp}-${index}`} cx={x} cy={y} r="4" fill="white" stroke={resultColors(point.status).line} strokeWidth="3" />;
                  })}
                </svg>
                <div className="flex items-center justify-between text-[9px] font-semibold text-[#74837f]"><span>{selectedHistory[0] ? shortDate(selectedHistory[0].date) : "No history"}</span><span>{selectedHistory.length > 1 ? shortDate(selectedHistory[selectedHistory.length - 1].date) : "Latest"}</span></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2"><Link href={`/reports?reportId=${encodeURIComponent(selectedResult.reportId)}`} className="flex h-10 items-center justify-center rounded-md border border-[#cfded9] text-[11px] font-black text-[#0d5c46]">Open report</Link><Link href="/analytics" className="flex h-10 items-center justify-center rounded-md bg-[#0d5c46] text-[11px] font-black text-white">Full analytics</Link></div>
            </div>
          </section>
        </div>
      ) : null}
    </MobileShell>
  );
}

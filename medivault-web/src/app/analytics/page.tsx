"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReportMarker } from "@/components/app-data-provider";
import { useAppData } from "@/components/app-data-provider";
import { Icon, MobileShell } from "@/components/mobile-shell";
import { buildScoreTrend, calculateHealthScore, filterReportsByRange } from "@/lib/health-score";

function statusStyles(tone: string) {
  if (tone === "coral") return "bg-[#fff0ec] text-[#ba563d]";
  if (tone === "yellow") return "bg-[#fff8dc] text-[#9a6b00]";
  return "bg-[#eaf9f2] text-[#087766]";
}

function barColor(tone: string) {
  if (tone === "coral") return "bg-[#ec795c]";
  if (tone === "yellow") return "bg-[#e5a900]";
  return "bg-[#0a7d6e]";
}

function markerTone(marker: ReportMarker) {
  if (marker.status === "High" || marker.status === "Low") return "coral";
  if (marker.status === "Watch") return "yellow";
  return "mint";
}

function graphPalette(status: ReportMarker["status"]) {
  if (status === "High" || status === "Low") {
    return {
      badge: "bg-[#fff0ec] text-[#ba563d]",
      border: "border-[#f2c6bb]",
      card: "bg-[#fff7f4]",
      line: "#ec795c",
      ring: "ring-[#f4d1c8]",
      soft: "#fff0ec",
      text: "text-[#ba563d]",
    };
  }
  if (status === "Watch") {
    return {
      badge: "bg-[#fff8dc] text-[#9a6b00]",
      border: "border-[#efd88b]",
      card: "bg-[#fffaf0]",
      line: "#e5a900",
      ring: "ring-[#f2dda0]",
      soft: "#fff8dc",
      text: "text-[#9a6b00]",
    };
  }
  return {
    badge: "bg-[#eaf9f2] text-[#087766]",
    border: "border-[#bfe9df]",
    card: "bg-[#f4fffb]",
    line: "#0a7d6e",
    ring: "ring-[#bfe9df]",
    soft: "#eaf9f2",
    text: "text-[#087766]",
  };
}

function markerWidth(marker: ReportMarker, index: number) {
  if (marker.status === "High") return "78%";
  if (marker.status === "Low") return "42%";
  if (marker.status === "Watch") return "62%";
  return `${Math.max(44, 76 - index * 6)}%`;
}

function reportTimestamp(report: { createdAt?: number; date: string }) {
  if (typeof report.createdAt === "number" && Number.isFinite(report.createdAt)) return report.createdAt;
  const parsed = Date.parse(report.date);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function numericMarkerValue(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function trendPath(values: number[]) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 88 : 8 + (index / (values.length - 1)) * 80;
      const y = 48 - ((value - min) / spread) * 36;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function Analytics() {
  const { activeMember, reportsForActiveMember } = useAppData();
  const [range, setRange] = useState("90 days");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [selectedParameterName, setSelectedParameterName] = useState<string | null>(null);
  const closeGraphButtonRef = useRef<HTMLButtonElement>(null);
  const hasMember = Boolean(activeMember);
  const rangedReports = useMemo(() => filterReportsByRange(reportsForActiveMember, range), [range, reportsForActiveMember]);
  const score = calculateHealthScore(rangedReports);
  const scoreBars = useMemo(() => buildScoreTrend(reportsForActiveMember, range), [range, reportsForActiveMember]);
  const flaggedCount = rangedReports.filter((report) => report.abnormal > 0 || report.status === "Needs review").length;
  const verifiedPercent = rangedReports.length
    ? Math.round((rangedReports.filter((report) => report.status === "Reviewed" || report.status === "Normal").length / rangedReports.length) * 100)
    : 0;
  const parameters = useMemo(() => {
    return rangedReports.flatMap((report) =>
      report.markers.map((marker, index) => ({
        name: marker.name,
        value: marker.value,
        range: marker.range,
        status: marker.status,
        trend: marker.status === "Normal" ? "Stable" : report.status === "Needs review" ? "Needs care" : "Watch",
        width: markerWidth(marker, index),
        tone: markerTone(marker),
      })),
    );
  }, [rangedReports]);
  const visibleParameters = useMemo(() => {
    const list = showFlaggedOnly ? parameters.filter((param) => param.status === "High" || param.status === "Low" || param.status === "Watch") : parameters;
    return list.slice(0, 8);
  }, [parameters, showFlaggedOnly]);
  const historyTrends = useMemo(() => {
    const grouped = new Map<
      string,
      Array<{
        date: string;
        reportTitle: string;
        status: ReportMarker["status"];
        timestamp: number;
        unit: string;
        value: number;
      }>
    >();

    rangedReports.forEach((report) => {
      report.markers.forEach((marker) => {
        const value = numericMarkerValue(marker.value);
        if (value === null || !Number.isFinite(value)) return;
        const unit = marker.value.replace(/[-\d.,\s]/g, "").trim();
        const nextPoint = {
          date: report.date,
          reportTitle: report.title,
          status: marker.status,
          timestamp: reportTimestamp(report),
          unit,
          value,
        };
        grouped.set(marker.name, [...(grouped.get(marker.name) ?? []), nextPoint]);
      });
    });

    return Array.from(grouped.entries())
      .map(([name, points]) => {
        const sortedPoints = points.sort((a, b) => a.timestamp - b.timestamp);
        const latest = sortedPoints[sortedPoints.length - 1];
        const previous = sortedPoints[sortedPoints.length - 2];
        const delta = previous ? latest.value - previous.value : 0;
        const values = sortedPoints.map((point) => point.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return {
          name,
          changeText: previous ? `${delta >= 0 ? "+" : "-"}${Math.abs(delta).toFixed(delta % 1 === 0 ? 0 : 1)}${latest.unit ? ` ${latest.unit}` : ""}` : "New",
          delta,
          latest,
          max,
          min,
          path: trendPath(values),
          points: sortedPoints,
        };
      })
      .sort((a, b) => {
        const aPriority = a.points.length > 1 ? 1 : 0;
        const bPriority = b.points.length > 1 ? 1 : 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return Math.abs(b.delta) - Math.abs(a.delta);
      });
  }, [rangedReports]);
  const selectedTrend = selectedParameterName ? historyTrends.find((trend) => trend.name === selectedParameterName) ?? null : null;
  const featuredTrends = useMemo(() => historyTrends.slice(0, 6), [historyTrends]);
  const latestSummary = rangedReports.find((report) => report.summary)?.summary;
  const selectParameter = (name: string) => {
    setSelectedParameterName(name);
  };

  useEffect(() => {
    if (!selectedTrend) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeGraphButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedParameterName(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedTrend]);

  return (
    <MobileShell>
      <section className="px-5 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[#087766]">Health intelligence</p>
            <h1 className="mt-1 text-[26px] font-black leading-tight text-[#101c1c]">Analytics</h1>
          </div>
          <Link
            href="/dashboard"
            className="grid h-11 w-11 place-items-center rounded-lg border border-[#dce9e5] bg-white text-[#223230] shadow-[0_8px_24px_rgba(20,67,60,0.08)]"
            aria-label="Dashboard"
          >
            <Icon name="home" className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-[#dce9e5] bg-white p-1">
          {["90 days", "6 months", "1 year"].map((label) => (
            <button
              key={label}
              onClick={() => setRange(label)}
              className={`h-9 rounded-md text-[12px] font-bold ${
                range === label ? "bg-[#102323] text-white shadow-[0_8px_18px_rgba(16,35,35,0.18)]" : "text-[#65716f]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg bg-[#102323] p-5 text-white shadow-[0_24px_54px_rgba(16,35,35,0.28)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#a9bfba]">Overall score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[56px] font-black leading-none">{hasMember && rangedReports.length ? score : "--"}</span>
                <span className="mb-2 rounded-md bg-[#173938] px-2 py-1 text-[11px] font-bold text-[#99f0db]">{hasMember && rangedReports.length ? "live" : "--"}</span>
              </div>
              <p className="mt-3 text-[13px] leading-5 text-[#c5d4d1]">
                {hasMember ? `${range} view, with ${flaggedCount} report${flaggedCount === 1 ? "" : "s"} needing attention.` : "Add a member and upload reports to unlock analytics."}
              </p>
            </div>

          <div
            className="grid h-[104px] w-[104px] place-items-center rounded-full"
            style={{
              background: hasMember && rangedReports.length
                ? `conic-gradient(#39deb8 0 ${score}%, rgba(255,255,255,0.13) ${score}% 100%)`
                : "conic-gradient(#2b3a3a 0 100%, rgba(255,255,255,0.13) 100% 100%)",
            }}
          >
            <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[#102323]">
              <Icon name="trend" className="h-7 w-7 text-[#99f0db]" />
            </div>
          </div>
          </div>

          <div className="mt-6 flex h-[96px] items-end gap-2 border-t border-white/10 pt-5">
            {scoreBars.map((height, index) => (
              <div key={index} className="flex flex-1 items-end">
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${height}px`,
                    backgroundColor: index === scoreBars.length - 1 ? "#39deb8" : "rgba(255,255,255,0.2)",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#a9bfba]">
            <span>{range} ago</span>
            <span>Today</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-[#e2ebe8] bg-white p-3">
            <p className="text-[11px] font-bold text-[#7b8986]">Scanned</p>
            <p className="mt-2 text-[24px] font-black text-[#162523]">{rangedReports.length}</p>
          </div>
          <div className="rounded-lg border border-[#e2ebe8] bg-white p-3">
            <p className="text-[11px] font-bold text-[#7b8986]">Flagged</p>
            <p className="mt-2 text-[24px] font-black text-[#ba563d]">{flaggedCount}</p>
          </div>
          <div className="rounded-lg border border-[#e2ebe8] bg-white p-3">
            <p className="text-[11px] font-bold text-[#7b8986]">Verified</p>
            <p className="mt-2 text-[24px] font-black text-[#087766]">{verifiedPercent}%</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[#dce9e5] bg-[#f7fbfa] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e8f7f2] text-[#087766]">
              <Icon name="calendar" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-black text-[#162523]">Doctor visit ready</h2>
                <span className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#52605d]">
                  {rangedReports.length} reports
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-5 text-[#65716f]">
                {hasMember && rangedReports.length
                  ? `${rangedReports.length} report${rangedReports.length === 1 ? "" : "s"} grouped for quick review.`
                  : "Upload reports to create this summary."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-black text-[#101c1c]">Past history</h2>
          <span className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#65716f]">{range}</span>
        </div>

        {hasMember && featuredTrends.length ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {featuredTrends.map((trend) => {
              const palette = graphPalette(trend.latest.status);
              return (
                <button
                  key={trend.name}
                  onClick={() => selectParameter(trend.name)}
                  className={`rounded-lg border ${palette.border} ${palette.card} p-3 text-left shadow-[0_10px_24px_rgba(20,67,60,0.04)] transition hover:ring-2 ${palette.ring}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-black text-[#162523]">{trend.name}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#7b8986]">{trend.points.length} readings</p>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-[10px] font-black ${palette.badge}`}>{trend.changeText}</span>
                  </div>
                  <p className={`mt-3 text-[11px] font-bold ${palette.text}`}>Open graph</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5 text-center">
            <p className="text-[16px] font-black text-[#162523]">Past history will build here</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Upload repeat reports with the same test names to see plus-minus movement and graphs.</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-[18px] font-black text-[#101c1c]">Key parameters</h2>
          <button
            onClick={() => setShowFlaggedOnly((current) => !current)}
            className="rounded-md bg-[#e8f7f2] px-3 py-2 text-[12px] font-bold text-[#087766]"
          >
            {showFlaggedOnly ? "All" : "Flagged"}
          </button>
        </div>

        {hasMember && visibleParameters.length ? (
          <div className="mt-3 space-y-3">
            {visibleParameters.map((param) => (
              <button
                key={`${param.name}-${param.value}`}
                onClick={() => selectParameter(param.name)}
                className={`w-full rounded-lg border bg-white p-4 text-left shadow-[0_10px_28px_rgba(20,67,60,0.05)] transition ${
                  selectedTrend?.name === param.name ? "border-[#0a7d6e] ring-2 ring-[#bfe9df]" : "border-[#e2ebe8]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-black text-[#162523]">{param.name}</h3>
                    <p className="mt-1 text-[12px] font-medium text-[#7b8986]">{param.range}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[17px] font-black text-[#162523]">{param.value}</p>
                    <p className={`mt-1 rounded-md px-2 py-1 text-[11px] font-bold ${statusStyles(param.tone)}`}>
                      {param.status}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf3f1]">
                  <div className={`h-full rounded-full ${barColor(param.tone)}`} style={{ width: param.width }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#8a9794]">
                  <span>Trend: {param.trend}</span>
                  <span>Open graph</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-[#c5d8d3] bg-white p-5 text-center">
            <p className="text-[16px] font-black text-[#162523]">No analytics yet</p>
            <p className="mt-2 text-[13px] text-[#65716f]">Upload reports to start tracking detected values and trends.</p>
          </div>
        )}

        <div className="mt-5 rounded-lg border border-[#e2ebe8] bg-white p-4">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eaf9f2] text-[#087766]">
              <Icon name="shield" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[14px] font-black text-[#162523]">Smart summary</h2>
              <p className="mt-1 text-[13px] leading-5 text-[#65716f]">
                {latestSummary || "AI-style report summaries will appear here after you upload and process reports."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {selectedTrend ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-[#102323]/55 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 backdrop-blur-sm sm:items-center sm:justify-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedParameterName(null);
          }}
        >
          <div
            aria-labelledby="analytics-graph-title"
            aria-modal="true"
            className="max-h-[min(88dvh,760px)] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-[18px] bg-white shadow-[0_28px_80px_rgba(6,30,28,0.35)]"
            role="dialog"
          >
            {(() => {
              const trend = selectedTrend;
              const palette = graphPalette(trend.latest.status);
              return (
                <>
                  <div className="bg-[#102323] p-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#99f0db]">Past result graph</p>
                        <h3 id="analytics-graph-title" className="mt-1 truncate text-[22px] font-black">{trend.name}</h3>
                      </div>
                      <button
                        type="button"
                        ref={closeGraphButtonRef}
                        onClick={() => setSelectedParameterName(null)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white"
                        aria-label="Close graph"
                      >
                        <span className="text-[20px] leading-none">x</span>
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[12px] leading-5 text-[#c5d4d1]">
                        Latest {trend.latest.value}
                        {trend.latest.unit ? ` ${trend.latest.unit}` : ""} from {trend.latest.date}
                      </p>
                      <span className={`shrink-0 rounded-md px-2 py-1 text-[12px] font-black ${palette.badge}`}>{trend.changeText}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className={`rounded-lg p-3 ring-1 ${palette.ring}`} style={{ backgroundColor: palette.soft }}>
                      <svg viewBox="0 0 96 56" className="h-40 w-full" role="img" aria-label={`${trend.name} past value graph`}>
                        <path d="M8 48H88" stroke="#d8e6e2" strokeWidth="2" strokeLinecap="round" />
                        <path d="M8 30H88" stroke="#e7efed" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 5" />
                        <path d="M8 12H88" stroke="#e7efed" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 5" />
                        <path d={trend.path} fill="none" stroke={palette.line} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        {trend.points.map((point, index) => {
                          const pointPalette = graphPalette(point.status);
                          const spread = trend.max - trend.min || 1;
                          const x = trend.points.length === 1 ? 88 : 8 + (index / (trend.points.length - 1)) * 80;
                          const y = 48 - ((point.value - trend.min) / spread) * 36;
                          return <circle key={`${point.timestamp}-${index}`} cx={x} cy={y} r="3.2" fill="#ffffff" stroke={pointPalette.line} strokeWidth="2.4" />;
                        })}
                      </svg>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-[#8a9794]">
                        <span>{trend.points[0]?.date}</span>
                        <span>{trend.points.length} values</span>
                        <span>{trend.latest.date}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {trend.points.map((point, index) => (
                        <div key={`${point.timestamp}-${index}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${graphPalette(point.status).border} ${graphPalette(point.status).card}`}>
                          <div>
                            <p className="text-[12px] font-black text-[#162523]">
                              {point.value}
                              {point.unit ? ` ${point.unit}` : ""}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-[#7b8986]">{point.date}</p>
                          </div>
                          <span className={`rounded-md px-2 py-1 text-[10px] font-black ${graphPalette(point.status).badge}`}>
                            {point.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}

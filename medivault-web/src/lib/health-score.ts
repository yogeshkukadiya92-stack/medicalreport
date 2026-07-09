import type { AppReport, ReportMarker } from "@/lib/vault-types";

const rangeDays: Record<string, number> = {
  "90 days": 90,
  "6 months": 183,
  "1 year": 365,
};

function markerPenalty(marker: ReportMarker) {
  if (marker.status === "High" || marker.status === "Low") return 8;
  if (marker.status === "Watch") return 4;
  return 0;
}

function reportTime(report: AppReport) {
  if (typeof report.createdAt === "number" && Number.isFinite(report.createdAt)) return report.createdAt;
  const parsed = Date.parse(report.date);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function filterReportsByRange(reports: AppReport[], range: string, now = Date.now()) {
  const days = rangeDays[range] ?? rangeDays["90 days"];
  const start = now - days * 24 * 60 * 60 * 1000;
  return reports.filter((report) => reportTime(report) >= start);
}

export function calculateHealthScore(reports: AppReport[]) {
  if (!reports.length) return 0;
  const markerRisk = reports.reduce((total, report) => total + report.markers.reduce((sum, marker) => sum + markerPenalty(marker), 0), 0);
  const reportRisk = reports.reduce((total, report) => {
    if (report.status === "Needs review") return total + 8;
    if (report.status === "Watch") return total + 4;
    return total;
  }, 0);
  const volumeAdjustedRisk = Math.min(68, markerRisk + reportRisk);
  return Math.max(32, Math.round(100 - volumeAdjustedRisk));
}

export function healthScoreLabel(score: number, hasReports: boolean) {
  if (!hasReports) return "Waiting";
  if (score >= 90) return "Great";
  if (score >= 75) return "Good";
  if (score >= 60) return "Watch";
  return "Review";
}

export function buildScoreTrend(reports: AppReport[], range: string, buckets = 8) {
  const days = rangeDays[range] ?? rangeDays["90 days"];
  const now = Date.now();
  const start = now - days * 24 * 60 * 60 * 1000;
  const bucketSize = (now - start) / buckets;
  let lastScore = calculateHealthScore(filterReportsByRange(reports, range, now));

  return Array.from({ length: buckets }, (_, index) => {
    const bucketStart = start + bucketSize * index;
    const bucketEnd = index === buckets - 1 ? now + 1 : bucketStart + bucketSize;
    const bucketReports = reports.filter((report) => {
      const time = reportTime(report);
      return time >= bucketStart && time < bucketEnd;
    });
    if (bucketReports.length) lastScore = calculateHealthScore(bucketReports);
    return Math.max(16, Math.round((lastScore / 100) * 86));
  });
}

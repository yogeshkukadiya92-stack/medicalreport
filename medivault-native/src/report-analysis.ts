import type { AppReport, ReportMarker } from "./types";

export function measuredMarkers(markers: ReportMarker[] = []) {
  return markers.filter((marker) => marker.name.trim() && marker.value.trim()
    && !/^(uploaded|pending|processing|--|n\/a)$/i.test(marker.value.trim()));
}

export function normalizeReport(report: AppReport): AppReport {
  const markers = measuredMarkers(report.markers);
  const failed = markers.length !== report.markers.length || (!markers.length && report.source !== "lab" && report.status === "Reviewed");
  return { ...report, markers, parameters: markers.length,
    abnormal: markers.filter((marker) => marker.status === "High" || marker.status === "Low").length,
    ...(failed ? { status: "Needs review", summary: "No measured values were extracted. Select the original report to retry analysis." } : {}) };
}

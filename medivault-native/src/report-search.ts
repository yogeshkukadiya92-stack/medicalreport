import type { AppReport } from "./types";

export function matchesReportSearch(report: AppReport, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text = [report.title, report.lab, report.category,
    ...report.markers.map((marker) => marker.name)].join(" ").toLocaleLowerCase();
  return terms.every((term) => text.includes(term));
}

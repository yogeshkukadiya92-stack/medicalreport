import type { LabClient, LabReport, ReportMarker } from "@/lib/vault-types";

export type BodyCompositionPayload = {
  clients: LabClient[];
  lab: { id: string; name: string };
  metrics: {
    clients: number;
    drafts: number;
    flagged: number;
    published: number;
    scansToday: number;
  };
  reports: LabReport[];
};

export type BodyValueDraft = {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: ReportMarker["status"];
};

export const bodyCompositionMetrics = [
  ["Height", "cm", "> 0"],
  ["Weight", "kg", "> 0"],
  ["BMI", "kg/m2", "18.5-24.9"],
  ["PBF", "%", "10-25"],
  ["Skeletal Muscle Mass", "kg", "> 0"],
  ["Body Fat Mass", "kg", "7.5-14.9"],
  ["Total Body Water", "L", "> 0"],
  ["Protein", "kg", "> 0"],
  ["Minerals", "kg", "> 0"],
  ["InBody Score", "score", "70-100"],
  ["Basal Metabolic Rate", "kcal", "> 0"],
  ["Waist-Hip Ratio", "ratio", "0.80-0.90"],
  ["Visceral Fat Level", "level", "1-9"],
  ["Obesity Degree", "%", "90-110"],
  ["Target Weight", "kg", "> 0"],
  ["Weight Control", "kg", ""],
  ["Fat Control", "kg", ""],
  ["Muscle Control", "kg", ""],
] as const;

export function emptyBodyValues(): BodyValueDraft[] {
  return bodyCompositionMetrics.map(([name, unit, referenceRange], index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name,
    value: "",
    unit,
    referenceRange,
    status: "Watch",
  }));
}

export function numericBodyValue(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function normalizedBodyMetric(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function reportMetric(report: LabReport | undefined, names: string[]) {
  if (!report) return null;
  const normalized = names.map(normalizedBodyMetric);
  return report.values.find((value) => normalized.includes(normalizedBodyMetric(value.name))) ?? null;
}

export function bodyReportTitle(report: LabReport) {
  return report.title || `${report.reportType} - ${report.clientName}`;
}

import type { AppReport, LabReport, LabReportValue, ReportMarker } from "@/lib/vault-types";

export function normalizeCountryCode(countryCode = "+91") {
  const digits = countryCode.replace(/\D/g, "");
  return digits || "91";
}

export function normalizeLocalPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function normalizePhone(phone: string, countryCode = "+91") {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (phone.trim().startsWith("+")) return digits;
  if (digits.length > 10) return digits;
  return `${normalizeCountryCode(countryCode)}${digits}`;
}

export function phoneMatchKeys(phone: string, countryCode = "+91") {
  const full = normalizePhone(phone, countryCode);
  const local = normalizeLocalPhone(phone);
  return [...new Set([full, local].filter((value) => value.length >= 8))];
}

function numberFromText(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function statusFromValue(value: string, referenceRange: string): ReportMarker["status"] {
  const numericValue = numberFromText(value);
  const cleanRange = referenceRange.replace(/,/g, "").trim();

  if (numericValue === null) {
    const cleanValue = value.trim().toLowerCase();
    if (!cleanValue) return "Watch";
    if (cleanRange.toLowerCase().includes("negative") && cleanValue.includes("positive")) return "High";
    if (cleanRange.toLowerCase().includes("negative") && cleanValue.includes("negative")) return "Normal";
    return "Watch";
  }

  const rangeMatch = cleanRange.match(/(-?\d+(\.\d+)?)\s*(?:-|to|–)\s*(-?\d+(\.\d+)?)/i);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[3]);
    if (Number.isFinite(low) && Number.isFinite(high)) {
      if (numericValue < low) return "Low";
      if (numericValue > high) return "High";
      return "Normal";
    }
  }

  const lessThanMatch = cleanRange.match(/(?:<|less than|up to)\s*(-?\d+(\.\d+)?)/i);
  if (lessThanMatch) {
    const high = Number(lessThanMatch[1]);
    return numericValue <= high ? "Normal" : "High";
  }

  const greaterThanMatch = cleanRange.match(/(?:>|greater than|above)\s*(-?\d+(\.\d+)?)/i);
  if (greaterThanMatch) {
    const low = Number(greaterThanMatch[1]);
    return numericValue >= low ? "Normal" : "Low";
  }

  return "Watch";
}

export function buildLabSummary(values: Array<Pick<LabReportValue, "name" | "status">>) {
  const flagged = values.filter((value) => value.status !== "Normal");
  if (!values.length) return "Structured lab report saved without values.";
  if (!flagged.length) return "All entered lab values are within the configured reference ranges.";

  const listed = flagged
    .slice(0, 3)
    .map((value) => `${value.name} ${value.status}`)
    .join(", ");
  return `${flagged.length} value${flagged.length > 1 ? "s" : ""} need attention: ${listed}.`;
}

export function labReportToAppReport(report: LabReport, memberId: string, memberName: string): AppReport {
  const markers = report.values.map((value) => ({
    name: value.name,
    range: value.referenceRange || "Reference range not added",
    status: value.status,
    value: value.unit ? `${value.value} ${value.unit}`.trim() : value.value,
  }));

  return {
    id: `lab-${report.id}`,
    title: report.title,
    category: report.reportType,
    lab: report.labName,
    date: report.reportDate,
    memberId,
    memberName,
    fileName: report.fileName || "Lab structured report",
    fileId: report.fileId,
    fileMimeType: report.fileMimeType,
    fileSizeBytes: report.fileSizeBytes,
    source: "lab",
    labId: report.labId,
    labName: report.labName,
    labReportId: report.id,
    clientCountryCode: report.clientCountryCode,
    clientPhone: report.clientPhone,
    publishedAt: report.publishedAt,
    createdByLabUserId: report.createdByLabUserId,
    doctorName: report.doctorName,
    accessionNumber: report.accessionNumber,
    sampleCollectedAt: report.sampleCollectedAt,
    reportType: report.reportType,
    parameters: report.parameters,
    abnormal: report.abnormal,
    status: report.abnormal ? "Needs review" : "Reviewed",
    starred: false,
    summary: report.summary,
    markers,
    aiConfidence: 0,
    createdAt: new Date(report.createdAt).getTime(),
  };
}

import type { ReportMarker } from "@/lib/vault-types";

export type AnalyzerResult = {
  code: string;
  name: string;
  notes: string;
  referenceRange: string;
  status: ReportMarker["status"];
  unit: string;
  value: string;
};

export type AnalyzerBatchRow = AnalyzerResult & {
  accessionNumber: string;
  clientName: string;
  clientPhone: string;
  reportDate: string;
  reportType: string;
};

export const DEFAULT_ANALYZER_TEST_CODE_MAP: Record<string, string> = {
  ALB: "Albumin",
  ALP: "Alkaline Phosphatase",
  ALT: "SGPT/ALT",
  AST: "SGOT/AST",
  BIL_D: "Direct Bilirubin",
  BIL_T: "Total Bilirubin",
  BILT: "Total Bilirubin",
  BUN: "Blood Urea Nitrogen",
  CHOL: "Total Cholesterol",
  CREA: "Creatinine",
  CR: "Creatinine",
  EGFR: "eGFR",
  FT3: "Free T3",
  FT4: "Free T4",
  GLU: "Random Blood Sugar",
  GLUF: "Fasting Blood Sugar",
  FBS: "Fasting Blood Sugar",
  PPBS: "Postprandial Blood Sugar",
  RBS: "Random Blood Sugar",
  HBA1C: "HbA1c",
  HCT: "Hematocrit",
  HDL: "HDL Cholesterol",
  HGB: "Hemoglobin",
  HB: "Hemoglobin",
  LDL: "LDL Cholesterol",
  MCH: "MCH",
  MCHC: "MCHC",
  MCV: "MCV",
  PLT: "Platelets",
  RBC: "RBC Count",
  T3: "T3",
  T4: "T4",
  TC: "Total Cholesterol",
  TG: "Triglycerides",
  TRIG: "Triglycerides",
  TSH: "TSH",
  UA: "Uric Acid",
  UREA: "Urea",
  VLDL: "VLDL",
  WBC: "WBC Count",
};

const HEADER_ALIASES = {
  accession: ["accession", "accessionnumber", "sampleid", "samplecode", "barcode", "orderid"],
  clientName: ["patient", "patientname", "client", "clientname", "name"],
  clientPhone: ["phone", "mobile", "mobilenumber", "patientphone", "clientphone"],
  code: ["code", "testcode", "parametercode", "analytecode", "assaycode"],
  date: ["date", "reportdate", "resultdate", "testdate"],
  flag: ["flag", "status", "abnormalflag", "resultflag", "interpretation"],
  name: ["test", "testname", "parameter", "parametername", "analyte", "assay"],
  notes: ["notes", "note", "comment", "remarks"],
  range: ["range", "referencerange", "normalrange", "ref.range", "reference"],
  reportType: ["reporttype", "panel", "profile", "department"],
  unit: ["unit", "units"],
  value: ["value", "result", "resultvalue", "observedvalue"],
} as const;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9.]+/g, "");
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/[\s/-]+/g, "_");
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function findColumn(headers: string[], aliases: readonly string[]) {
  return headers.findIndex((header) => aliases.includes(header));
}

function statusFromFlag(flag: string): ReportMarker["status"] {
  const normalized = flag.trim().toUpperCase();
  if (["H", "HI", "HIGH", "ABOVE", "HH", "CRITICAL HIGH"].includes(normalized)) return "High";
  if (["L", "LO", "LOW", "BELOW", "LL", "CRITICAL LOW"].includes(normalized)) return "Low";
  if (["N", "NORMAL", "OK", "WITHIN RANGE"].includes(normalized)) return "Normal";
  return "Watch";
}

export function mapAnalyzerTestName(code: string, suppliedName = "", customMappings: Record<string, string> = {}) {
  const normalizedCode = normalizeCode(code);
  return customMappings[normalizedCode] ?? DEFAULT_ANALYZER_TEST_CODE_MAP[normalizedCode] ?? (suppliedName.trim() || code.trim());
}

function parseAnalyzerFile(content: string) {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const delimiterCandidates = [",", "\t", ";", "|"];
  const delimiter = delimiterCandidates
    .map((candidate) => ({ candidate, count: parseDelimitedLine(lines[0], candidate).length }))
    .sort((left, right) => right.count - left.count)[0].candidate;
  const rawHeaders = parseDelimitedLine(lines[0], delimiter);
  const headers = rawHeaders.map(normalizeHeader);
  const columns = {
    accession: findColumn(headers, HEADER_ALIASES.accession),
    clientName: findColumn(headers, HEADER_ALIASES.clientName),
    clientPhone: findColumn(headers, HEADER_ALIASES.clientPhone),
    code: findColumn(headers, HEADER_ALIASES.code),
    date: findColumn(headers, HEADER_ALIASES.date),
    flag: findColumn(headers, HEADER_ALIASES.flag),
    name: findColumn(headers, HEADER_ALIASES.name),
    notes: findColumn(headers, HEADER_ALIASES.notes),
    range: findColumn(headers, HEADER_ALIASES.range),
    reportType: findColumn(headers, HEADER_ALIASES.reportType),
    unit: findColumn(headers, HEADER_ALIASES.unit),
    value: findColumn(headers, HEADER_ALIASES.value),
  };

  if (columns.value < 0 || (columns.code < 0 && columns.name < 0)) return null;

  return { columns, delimiter, lines };
}

export function parseAnalyzerResults(content: string, customMappings: Record<string, string> = {}): AnalyzerResult[] {
  const parsed = parseAnalyzerFile(content);
  if (!parsed) return [];
  const { columns, delimiter, lines } = parsed;

  return lines.slice(1).flatMap((line) => {
    const cells = parseDelimitedLine(line, delimiter);
    const code = columns.code >= 0 ? cells[columns.code]?.trim() ?? "" : "";
    const suppliedName = columns.name >= 0 ? cells[columns.name]?.trim() ?? "" : "";
    const value = cells[columns.value]?.trim() ?? "";
    const name = mapAnalyzerTestName(code, suppliedName, customMappings);
    if (!name || !value) return [];

    return [{
      code,
      name,
      notes: columns.notes >= 0 ? cells[columns.notes]?.trim() ?? "" : "",
      referenceRange: columns.range >= 0 ? cells[columns.range]?.trim() ?? "" : "",
      status: columns.flag >= 0 ? statusFromFlag(cells[columns.flag] ?? "") : "Watch",
      unit: columns.unit >= 0 ? cells[columns.unit]?.trim() ?? "" : "",
      value,
    }];
  });
}

export function parseAnalyzerBatch(content: string, customMappings: Record<string, string> = {}): AnalyzerBatchRow[] {
  const parsed = parseAnalyzerFile(content);
  if (!parsed) return [];
  const { columns, delimiter, lines } = parsed;

  return lines.slice(1).flatMap((line) => {
    const cells = parseDelimitedLine(line, delimiter);
    const read = (column: number) => (column >= 0 ? cells[column]?.trim() ?? "" : "");
    const code = read(columns.code);
    const suppliedName = read(columns.name);
    const value = read(columns.value);
    const name = mapAnalyzerTestName(code, suppliedName, customMappings);
    if (!name || !value) return [];

    return [{
      accessionNumber: read(columns.accession),
      clientName: read(columns.clientName),
      clientPhone: read(columns.clientPhone),
      code,
      name,
      notes: read(columns.notes),
      referenceRange: read(columns.range),
      reportDate: read(columns.date),
      reportType: read(columns.reportType),
      status: statusFromFlag(read(columns.flag)),
      unit: read(columns.unit),
      value,
    }];
  });
}

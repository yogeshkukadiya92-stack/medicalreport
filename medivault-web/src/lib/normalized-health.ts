import crypto from "node:crypto";
import type { Db } from "mongodb";
import type { LabReport, LabReportValue, LabRole, ReportMarker } from "@/lib/vault-types";

export type FhirCoding = {
  code?: string;
  display?: string;
  system?: string;
};

export type FhirReference = {
  display?: string;
  reference: string;
};

export type FhirObservation = {
  code: {
    coding: FhirCoding[];
    text: string;
  };
  effectiveDateTime: string;
  id: string;
  interpretation?: Array<{ coding: FhirCoding[]; text: string }>;
  issued: string;
  meta: {
    lastUpdated: string;
    profile: string[];
    security?: FhirCoding[];
  };
  referenceRange?: Array<{ text?: string }>;
  resourceType: "Observation";
  specimen?: FhirReference;
  status: "registered" | "preliminary" | "final" | "amended" | "corrected" | "cancelled";
  subject: FhirReference;
  valueQuantity?: {
    code?: string;
    system?: string;
    unit?: string;
    value: number;
  };
  valueString?: string;
};

export type FhirSpecimen = {
  accessionIdentifier?: { value: string };
  collection?: {
    collectedDateTime?: string;
  };
  id: string;
  meta: {
    lastUpdated: string;
    profile: string[];
    security?: FhirCoding[];
  };
  receivedTime?: string;
  resourceType: "Specimen";
  status: "available" | "unavailable" | "unsatisfactory" | "entered-in-error";
  subject: FhirReference;
  type?: {
    coding: FhirCoding[];
    text: string;
  };
};

export type FhirDiagnosticReport = {
  basedOn?: FhirReference[];
  category: Array<{ coding: FhirCoding[]; text: string }>;
  code: {
    coding: FhirCoding[];
    text: string;
  };
  effectiveDateTime: string;
  id: string;
  identifier: Array<{ system: string; value: string }>;
  issued: string;
  meta: {
    lastUpdated: string;
    profile: string[];
    security?: FhirCoding[];
  };
  performer: FhirReference[];
  presentedForm?: Array<{
    contentType?: string;
    title?: string;
    url?: string;
  }>;
  resourceType: "DiagnosticReport";
  result: FhirReference[];
  specimen?: FhirReference[];
  status: "registered" | "partial" | "preliminary" | "final" | "amended" | "corrected" | "cancelled";
  subject: FhirReference;
};

export type NormalizedDiagnosticRecord = {
  accessionNumber?: string;
  branchId?: string;
  createdAt: string;
  diagnosticReport: FhirDiagnosticReport;
  encryptedPayload?: string;
  id: string;
  labId: string;
  labReportId: string;
  normalizedClientPhone: string;
  observationIds: string[];
  reportDate: string;
  reportType: string;
  specimenIds: string[];
  status: "draft" | "verified" | "published" | "corrected" | "cancelled";
  storageObjectKey?: string;
  updatedAt: string;
  version: number;
};

export type NormalizedObservationRecord = {
  createdAt: string;
  id: string;
  labId: string;
  labReportId: string;
  name: string;
  normalizedClientPhone: string;
  observation: FhirObservation;
  status: ReportMarker["status"];
  unit?: string;
  updatedAt: string;
  value?: number | string;
};

export type NormalizedSpecimenRecord = {
  accessionNumber?: string;
  collectedAt?: string;
  createdAt: string;
  id: string;
  labId: string;
  labReportId: string;
  normalizedClientPhone: string;
  receivedAt?: string;
  specimen: FhirSpecimen;
  status: FhirSpecimen["status"];
  updatedAt: string;
};

export type PlatformAuditLog = {
  action: string;
  actorUserId?: string;
  createdAt: string;
  entityId: string;
  entityType: string;
  id: string;
  labId?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
};

export type BackgroundJob = {
  attempts: number;
  createdAt: string;
  error?: string;
  id: string;
  lockedAt?: string;
  payload: Record<string, unknown>;
  priority: "low" | "normal" | "high";
  runAfter: string;
  status: "queued" | "running" | "complete" | "failed";
  type:
    | "normalize_report"
    | "deliver_report"
    | "backup_snapshot"
    | "analyzer_import"
    | "tat_alert"
    | "critical_value_alert"
    | "fhir_export";
  updatedAt: string;
};

export type BackupManifest = {
  createdAt: string;
  id: string;
  objectKey: string;
  scope: "lab" | "vault" | "platform";
  status: "queued" | "complete" | "failed";
  targetId: string;
};

export type LabPermission =
  | "orders:manage"
  | "samples:collect"
  | "samples:receive"
  | "samples:reject"
  | "reports:enter"
  | "reports:verify"
  | "reports:publish"
  | "reports:correct"
  | "billing:manage"
  | "inventory:manage"
  | "settings:manage"
  | "analytics:view";

export const labRolePermissions: Record<LabRole, LabPermission[]> = {
  lab_admin: [
    "orders:manage",
    "samples:collect",
    "samples:receive",
    "samples:reject",
    "reports:enter",
    "reports:verify",
    "reports:publish",
    "reports:correct",
    "billing:manage",
    "inventory:manage",
    "settings:manage",
    "analytics:view",
  ],
  lab_staff: ["orders:manage", "samples:collect", "samples:receive", "reports:enter", "analytics:view"],
  pathologist: ["reports:verify", "reports:publish", "reports:correct", "analytics:view"],
  technician: ["samples:receive", "samples:reject", "reports:enter", "analytics:view"],
  cashier: ["billing:manage", "analytics:view"],
  collector: ["samples:collect", "analytics:view"],
};

export function hasLabPermission(role: LabRole, permission: LabPermission) {
  return labRolePermissions[role]?.includes(permission) ?? false;
}

export async function ensureNormalizedHealthIndexes(db: Db) {
  await Promise.all([
    db.collection("normalizedDiagnosticReports").createIndex({ labId: 1, labReportId: 1 }, { unique: true }),
    db.collection("normalizedDiagnosticReports").createIndex({ normalizedClientPhone: 1, reportDate: -1 }),
    db.collection("normalizedDiagnosticReports").createIndex({ labId: 1, accessionNumber: 1 }),
    db.collection("normalizedObservations").createIndex({ labId: 1, labReportId: 1 }),
    db.collection("normalizedObservations").createIndex({ normalizedClientPhone: 1, name: 1, "observation.effectiveDateTime": 1 }),
    db.collection("normalizedSpecimens").createIndex({ labId: 1, labReportId: 1 }),
    db.collection("orders").createIndex({ labId: 1, accessionNumber: 1 }, { unique: true, sparse: true }),
    db.collection("sampleEvents").createIndex({ labId: 1, accessionNumber: 1, createdAt: -1 }),
    db.collection("reportVersions").createIndex({ labId: 1, labReportId: 1, version: -1 }),
    db.collection("criticalValueAcknowledgements").createIndex({ labId: 1, labReportId: 1, acknowledgedAt: -1 }),
    db.collection("billingInvoices").createIndex({ labId: 1, clientId: 1, createdAt: -1 }),
    db.collection("inventoryLots").createIndex({ labId: 1, expiryDate: 1 }),
    db.collection("qualityControlRuns").createIndex({ labId: 1, analyzerId: 1, runAt: -1 }),
    db.collection("deliveryOutbox").createIndex({ labId: 1, status: 1, createdAt: 1 }),
    db.collection("platformAuditLogs").createIndex({ labId: 1, entityType: 1, entityId: 1, createdAt: -1 }),
    db.collection("platformAuditLogs").createIndex({ actorUserId: 1, createdAt: -1 }),
    db.collection("backgroundJobs").createIndex({ status: 1, priority: 1, runAfter: 1 }),
    db.collection("backupManifests").createIndex({ scope: 1, targetId: 1, createdAt: -1 }),
  ]);
}

function isoNow() {
  return new Date().toISOString();
}

function stableId(prefix: string, parts: Array<string | undefined>) {
  const hash = crypto.createHash("sha256").update(parts.filter(Boolean).join("|")).digest("hex").slice(0, 24);
  return `${prefix}-${hash}`;
}

function parseNumericValue(value: string) {
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function fhirStatus(report: LabReport): FhirDiagnosticReport["status"] {
  if (report.status === "draft") return "preliminary";
  if (report.status === "published") return "final";
  return "registered";
}

function observationInterpretation(status: ReportMarker["status"]) {
  const code = status === "High" ? "H" : status === "Low" ? "L" : status === "Normal" ? "N" : "A";
  return [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code, display: status }], text: status }];
}

function codeForTest(name: string): FhirCoding {
  return {
    display: name,
    system: "http://loinc.org",
  };
}

export function normalizeLabReportToFhir(report: LabReport) {
  const now = isoNow();
  const subject: FhirReference = {
    display: report.clientName,
    reference: `Patient/phone-${report.normalizedClientPhone}`,
  };
  const performer: FhirReference = {
    display: report.labName,
    reference: `Organization/${report.labId}`,
  };
  const specimenId = stableId("specimen", [report.labId, report.id, report.accessionNumber]);
  const specimen: FhirSpecimen = {
    accessionIdentifier: report.accessionNumber ? { value: report.accessionNumber } : undefined,
    collection: report.sampleCollectedAt ? { collectedDateTime: report.sampleCollectedAt } : undefined,
    id: specimenId,
    meta: {
      lastUpdated: now,
      profile: ["http://hl7.org/fhir/R4/specimen.html"],
      security: [{ system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality", code: "R", display: "restricted" }],
    },
    resourceType: "Specimen",
    status: "available",
    subject,
  };

  const observations = report.values.map((value, index) => {
    const numeric = parseNumericValue(value.value);
    const id = stableId("observation", [report.labId, report.id, value.name, String(index)]);
    const observation: FhirObservation = {
      code: {
        coding: [codeForTest(value.name)],
        text: value.name,
      },
      effectiveDateTime: report.reportDate,
      id,
      interpretation: observationInterpretation(value.status),
      issued: report.publishedAt ?? report.updatedAt,
      meta: {
        lastUpdated: now,
        profile: ["http://hl7.org/fhir/R4/observation.html"],
        security: [{ system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality", code: "R", display: "restricted" }],
      },
      referenceRange: value.referenceRange ? [{ text: value.referenceRange }] : undefined,
      resourceType: "Observation",
      specimen: { reference: `Specimen/${specimenId}` },
      status: fhirStatus(report) === "final" ? "final" : "preliminary",
      subject,
      valueQuantity:
        numeric === null
          ? undefined
          : {
              system: "http://unitsofmeasure.org",
              unit: value.unit || undefined,
              value: numeric,
            },
      valueString: numeric === null ? value.value : undefined,
    };
    return { source: value, observation };
  });

  const diagnosticReport: FhirDiagnosticReport = {
    category: [
      {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "LAB", display: "Laboratory" }],
        text: "Laboratory",
      },
    ],
    code: {
      coding: [{ display: report.reportType }],
      text: report.reportType,
    },
    effectiveDateTime: report.reportDate,
    id: stableId("diagnostic-report", [report.labId, report.id]),
    identifier: [
      { system: `https://medivault.local/labs/${report.labId}/reports`, value: report.labReportId },
      ...(report.accessionNumber ? [{ system: `https://medivault.local/labs/${report.labId}/accessions`, value: report.accessionNumber }] : []),
    ],
    issued: report.publishedAt ?? report.updatedAt,
    meta: {
      lastUpdated: now,
      profile: ["http://hl7.org/fhir/R4/diagnosticreport.html"],
      security: [{ system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality", code: "R", display: "restricted" }],
    },
    performer: [performer],
    presentedForm: report.fileId
      ? [
          {
            contentType: report.fileMimeType,
            title: report.fileName,
            url: `object://${report.fileId}`,
          },
        ]
      : undefined,
    resourceType: "DiagnosticReport",
    result: observations.map((entry) => ({ display: entry.observation.code.text, reference: `Observation/${entry.observation.id}` })),
    specimen: [{ reference: `Specimen/${specimenId}` }],
    status: fhirStatus(report),
    subject,
  };

  return { diagnosticReport, observations, specimen };
}

export async function syncNormalizedLabReport(db: Db, report: LabReport, actorUserId?: string) {
  await ensureNormalizedHealthIndexes(db);
  const now = isoNow();
  const normalized = normalizeLabReportToFhir(report);
  const existing = await db
    .collection<NormalizedDiagnosticRecord>("normalizedDiagnosticReports")
    .findOne({ labId: report.labId, labReportId: report.id }, { projection: { _id: 0, version: 1 } });
  const version = (existing?.version ?? 0) + 1;

  const diagnosticRecord: NormalizedDiagnosticRecord = {
    accessionNumber: report.accessionNumber,
    createdAt: report.createdAt,
    diagnosticReport: normalized.diagnosticReport,
    id: normalized.diagnosticReport.id,
    labId: report.labId,
    labReportId: report.id,
    normalizedClientPhone: report.normalizedClientPhone,
    observationIds: normalized.observations.map((entry) => entry.observation.id),
    reportDate: report.reportDate,
    reportType: report.reportType,
    specimenIds: [normalized.specimen.id],
    status: report.status === "published" ? "published" : "draft",
    storageObjectKey: report.fileId ? `reports/${report.labId}/${report.id}/${report.fileId}` : undefined,
    updatedAt: now,
    version,
  };

  const specimenRecord: NormalizedSpecimenRecord = {
    accessionNumber: report.accessionNumber,
    collectedAt: report.sampleCollectedAt,
    createdAt: report.createdAt,
    id: normalized.specimen.id,
    labId: report.labId,
    labReportId: report.id,
    normalizedClientPhone: report.normalizedClientPhone,
    specimen: normalized.specimen,
    status: normalized.specimen.status,
    updatedAt: now,
  };

  const observationRecords: NormalizedObservationRecord[] = normalized.observations.map((entry) => ({
    createdAt: report.createdAt,
    id: entry.observation.id,
    labId: report.labId,
    labReportId: report.id,
    name: entry.source.name,
    normalizedClientPhone: report.normalizedClientPhone,
    observation: entry.observation,
    status: entry.source.status,
    unit: entry.source.unit,
    updatedAt: now,
    value: parseNumericValue(entry.source.value) ?? entry.source.value,
  }));

  await db.collection<NormalizedDiagnosticRecord>("normalizedDiagnosticReports").updateOne(
    { labId: report.labId, labReportId: report.id },
    {
      $set: diagnosticRecord,
      $setOnInsert: { createdAt: report.createdAt },
    },
    { upsert: true },
  );

  await db.collection<NormalizedSpecimenRecord>("normalizedSpecimens").updateOne(
    { labId: report.labId, labReportId: report.id },
    { $set: specimenRecord },
    { upsert: true },
  );

  await db.collection<NormalizedObservationRecord>("normalizedObservations").deleteMany({
    labId: report.labId,
    labReportId: report.id,
  });
  if (observationRecords.length) {
    await db.collection<NormalizedObservationRecord>("normalizedObservations").insertMany(observationRecords);
  }

  await db.collection("reportVersions").insertOne({
    createdAt: now,
    diagnosticReport: normalized.diagnosticReport,
    labId: report.labId,
    labReportId: report.id,
    observations: normalized.observations.map((entry) => entry.observation),
    specimen: normalized.specimen,
    version,
  });

  await addPlatformAuditLog(db, {
    action: "fhir_normalized",
    actorUserId,
    entityId: report.id,
    entityType: "lab_report",
    labId: report.labId,
    metadata: {
      observationCount: observationRecords.length,
      version,
    },
  });

  await enqueueBackgroundJob(db, {
    payload: { labId: report.labId, labReportId: report.id, version },
    priority: "normal",
    type: "backup_snapshot",
  });

  return { diagnosticRecord, observationRecords, specimenRecord };
}

export async function addPlatformAuditLog(db: Db, input: Omit<PlatformAuditLog, "createdAt" | "id">) {
  await ensureNormalizedHealthIndexes(db);
  const log: PlatformAuditLog = {
    id: stableId("audit", [input.labId, input.entityType, input.entityId, input.action, isoNow(), Math.random().toString(16)]),
    createdAt: isoNow(),
    ...input,
  };
  await db.collection<PlatformAuditLog>("platformAuditLogs").insertOne(log);
  return log;
}

export async function enqueueBackgroundJob(
  db: Db,
  input: Pick<BackgroundJob, "payload" | "priority" | "type"> & Partial<Pick<BackgroundJob, "runAfter">>,
) {
  await ensureNormalizedHealthIndexes(db);
  const now = isoNow();
  const job: BackgroundJob = {
    attempts: 0,
    createdAt: now,
    id: stableId("job", [input.type, JSON.stringify(input.payload), now]),
    payload: input.payload,
    priority: input.priority,
    runAfter: input.runAfter ?? now,
    status: "queued",
    type: input.type,
    updatedAt: now,
  };
  await db.collection<BackgroundJob>("backgroundJobs").insertOne(job);
  return job;
}

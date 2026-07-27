import crypto from "node:crypto";
import type { Db } from "mongodb";
import { normalizePhone } from "@/lib/lab-utils";
import type { AppReport, LabReport, VaultSnapshot } from "@/lib/vault-types";

export type SecureShare = {
  accessCount: number;
  createdAt: string;
  expiresAt: string;
  id: string;
  lastAccessedAt?: string;
  recipientLabel?: string;
  reportId: string;
  reportSnapshot: AppReport;
  revokedAt?: string;
  tokenHash: string;
  tokenPrefix: string;
  userId: string;
};

export function hashShareToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createShareToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashShareToken(token), tokenPrefix: token.slice(0, 8) };
}

export async function ensureSecureShareIndexes(db: Db) {
  await Promise.all([
    db.collection<SecureShare>("secureShares").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection<SecureShare>("secureShares").createIndex({ userId: 1, createdAt: -1 }),
    db.collection<SecureShare>("secureShares").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }),
    db.collection("secureShareAuditLogs").createIndex({ shareId: 1, createdAt: -1 }),
  ]);
}

export async function findOwnedReport(db: Db, userId: string, reportId: string) {
  const vault = await db.collection("vaults").findOne<{ snapshot?: VaultSnapshot }>({ userId });
  const snapshot = vault?.snapshot;
  const selfReport = snapshot?.reports?.find((report) => report.id === reportId && report.source !== "lab");
  if (selfReport) return selfReport;

  const rawLabId = reportId.startsWith("lab-") ? reportId.slice(4) : reportId;
  const phones = (snapshot?.familyMembers ?? [])
    .map((member) => ({ member, phone: normalizePhone(member.phone ?? "") }))
    .filter((entry) => entry.phone.length >= 8);
  if (!phones.length) return null;

  const report = await db.collection<LabReport>("labReports").findOne(
    {
      id: rawLabId,
      normalizedClientPhone: { $in: [...new Set(phones.map((entry) => entry.phone))] },
      status: "published",
    },
    { projection: { _id: 0 } },
  );
  if (!report) return null;
  const member = phones.find((entry) => entry.phone === report.normalizedClientPhone)?.member;
  if (!member) return null;

  return {
    abnormal: report.abnormal,
    accessionNumber: report.accessionNumber,
    aiConfidence: report.aiConfidence ?? 0,
    category: report.reportType,
    clientPhone: report.clientPhone,
    createdAt: Date.parse(report.createdAt),
    date: report.reportDate,
    doctorName: report.doctorName,
    fileName: report.fileName || "Structured medical report",
    id: `lab-${report.id}`,
    lab: report.labName,
    labId: report.labId,
    labName: report.labName,
    labReportId: report.id,
    markers: report.values.map((value) => ({
      name: value.name,
      range: value.referenceRange || "Reference range not added",
      status: value.status,
      value: `${value.value}${value.unit ? ` ${value.unit}` : ""}`,
    })),
    memberId: member.id,
    memberName: member.name,
    parameters: report.parameters,
    publishedAt: report.publishedAt,
    reportType: report.reportType,
    sampleCollectedAt: report.sampleCollectedAt,
    source: "lab",
    starred: false,
    status: report.abnormal ? "Needs review" : "Reviewed",
    summary: report.summary,
    title: report.title,
  } satisfies AppReport;
}

export function publicShare(share: SecureShare) {
  const { tokenHash: _tokenHash, userId: _userId, ...safe } = share;
  return safe;
}

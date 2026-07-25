import type { Db } from "mongodb";
import { addLabAuditLog } from "@/lib/lab-server";
import { buildLabSummary, normalizePhone } from "@/lib/lab-utils";
import type { BodyAnalysisJob } from "@/lib/body-analysis-jobs";
import type { LabClient, LabReport, LabReportValue } from "@/lib/vault-types";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export async function saveAutomatedBodyCompositionReport(db: Db, job: BodyAnalysisJob) {
  if (!job.automation || !job.result?.markers.length || job.savedReportId) return null;
  const normalizedPhone = normalizePhone(job.automation.clientPhone);
  if (normalizedPhone.length < 8) throw new Error("Telegram import is missing a valid client mobile number.");

  const now = new Date().toISOString();
  const existingClient = await db.collection<LabClient>("labClients").findOne(
    { labId: job.labId, normalizedPhone },
    { projection: { _id: 0 } },
  );
  const client: LabClient = {
    id: existingClient?.id ?? newId("client"),
    labId: job.labId,
    name: job.automation.clientName || existingClient?.name || "Telegram client",
    phone: job.automation.clientPhone,
    normalizedPhone,
    createdAt: existingClient?.createdAt ?? now,
    updatedAt: now,
  };
  await db.collection<LabClient>("labClients").updateOne(
    { labId: job.labId, normalizedPhone },
    { $set: client },
    { upsert: true },
  );

  const reportId = newId("body");
  const values: LabReportValue[] = job.result.markers.map((marker) => ({
    id: newId("value"),
    labId: job.labId,
    labReportId: reportId,
    name: marker.name,
    value: marker.value,
    unit: "",
    referenceRange: marker.range,
    status: marker.status,
    createdAt: now,
    updatedAt: now,
  }));
  const duplicate = await db.collection<LabReport>("labReports").findOne(
    {
      labId: job.labId,
      normalizedClientPhone: normalizedPhone,
      reportDate: job.automation.reportDate,
      reportType: "BMI & Body Composition",
    },
    { projection: { _id: 0, id: 1 } },
  );
  const report: LabReport = {
    id: reportId,
    labId: job.labId,
    labName: job.lab || "MediVault Body Composition",
    labReportId: `BC-${Date.now()}`,
    clientId: client.id,
    clientName: client.name,
    clientPhone: client.phone,
    normalizedClientPhone: normalizedPhone,
    reportType: "BMI & Body Composition",
    reportDate: job.automation.reportDate,
    title: job.result.title || `Body Composition - ${client.name}`,
    status: "draft",
    workflowStatus: "entered",
    values,
    abnormal: values.filter((value) => value.status !== "Normal").length,
    parameters: values.length,
    summary: job.result.summary || buildLabSummary(values),
    entrySource: "photo",
    aiConfidence: job.result.aiConfidence,
    fileId: job.fileId,
    fileName: job.fileName,
    createdByLabUserId: job.userId,
    duplicateOfReportId: duplicate?.id,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<LabReport>("labReports").insertOne(report);
  await db.collection<LabReportValue>("labReportValues").insertMany(values);
  await db.collection("telegramBodyImports").updateOne(
    { sourceId: job.automation.sourceId },
    { $set: { reportId, status: "completed", updatedAt: now } },
  );
  await db.collection("bodyAnalysisJobs").updateOne({ id: job.id }, { $set: { savedReportId: reportId } });
  await addLabAuditLog(db, {
    action: "create",
    actorUserId: job.userId,
    labId: job.labId,
    labReportId: reportId,
    note: "Telegram body-composition report imported and saved for verification.",
  });
  return report;
}

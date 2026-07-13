import { NextRequest, NextResponse } from "next/server";
import type { AdminClientAccount, AdminClientDetailPayload, AdminTask } from "@/lib/admin-types";
import { enrichAdminClients, enrichAdminReports, getAdminContext, normalizeAdminPhone } from "@/lib/admin-server";
import type { LabClient, LabReport, VaultSnapshot } from "@/lib/vault-types";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ clientId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { clientId } = await params;
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const client = await context.db.collection<LabClient>("labClients").findOne(
    { id: clientId, labId: context.lab.id },
    { projection: { _id: 0 } },
  );
  if (!client) return NextResponse.json({ error: "Client was not found in this lab." }, { status: 404 });

  const phone = normalizeAdminPhone(client.normalizedPhone || client.phone);
  const [reportDocs, account, tasks, orders, invoices] = await Promise.all([
    context.db.collection<LabReport>("labReports").find(
      { clientId: client.id, labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ reportDate: -1, createdAt: -1 }).limit(150).toArray(),
    context.db.collection<AdminClientAccount>("authUsers").findOne(
      { phone },
      { projection: { _id: 0, createdAt: 1, email: 1, id: 1, name: 1, phone: 1, updatedAt: 1 } },
    ),
    context.db.collection<AdminTask>("adminTasks").find(
      { clientId: client.id, labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ status: 1, dueDate: 1, updatedAt: -1 }).limit(100).toArray(),
    context.db.collection("labOrders").find(
      { labId: context.lab.id, patientPhone: { $regex: `${phone}$` } },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).limit(30).toArray(),
    context.db.collection("billingInvoices").find(
      { clientId: client.id, labId: context.lab.id },
      { projection: { _id: 0 } },
    ).sort({ createdAt: -1 }).limit(30).toArray(),
  ]);

  const reportIds = reportDocs.map((report) => report.id);
  const [clientRows, reports, audit, vault, consents] = await Promise.all([
    enrichAdminClients(context.db, context.lab.id, [client]),
    enrichAdminReports(context.db, context.lab.id, reportDocs),
    reportIds.length
      ? context.db.collection("labReportAuditLogs").find(
        { labId: context.lab.id, labReportId: { $in: reportIds } },
        { projection: { _id: 0 } },
      ).sort({ createdAt: -1 }).limit(50).toArray()
      : Promise.resolve([]),
    account
      ? context.db.collection<{ snapshot?: VaultSnapshot }>("vaults").findOne(
        { userId: account.id },
        { projection: { _id: 0, snapshot: 1 } },
      )
      : Promise.resolve(null),
    account
      ? context.db.collection("consents").find(
        { userId: account.id },
        { projection: { _id: 0, consent_type: 1, is_granted: 1, updated_at: 1 } },
      ).sort({ updated_at: -1 }).toArray()
      : Promise.resolve([]),
  ]);

  const payload: AdminClientDetailPayload = {
    account,
    audit: audit.map((item) => ({
      action: String(item.action || "activity"),
      actorUserId: typeof item.actorUserId === "string" ? item.actorUserId : undefined,
      createdAt: String(item.createdAt || ""),
      id: typeof item.id === "string" ? item.id : undefined,
      note: typeof item.note === "string" ? item.note : undefined,
    })),
    client: clientRows[0]!,
    consents: consents.map((consent) => ({
      consent_type: typeof consent.consent_type === "string" ? consent.consent_type : undefined,
      is_granted: typeof consent.is_granted === "boolean" ? consent.is_granted : undefined,
      updated_at: typeof consent.updated_at === "string" ? consent.updated_at : undefined,
    })),
    invoices: invoices.map((invoice) => ({
      amount: typeof invoice.amount === "number" ? invoice.amount : undefined,
      createdAt: typeof invoice.createdAt === "string" ? invoice.createdAt : undefined,
      id: typeof invoice.id === "string" ? invoice.id : undefined,
      status: typeof invoice.status === "string" ? invoice.status : undefined,
    })),
    lab: context.lab,
    orders: orders.map((order) => ({
      accessionNumber: typeof order.accessionNumber === "string" ? order.accessionNumber : undefined,
      createdAt: typeof order.createdAt === "string" ? order.createdAt : undefined,
      id: typeof order.id === "string" ? order.id : undefined,
      priority: typeof order.priority === "string" ? order.priority : undefined,
      sampleType: typeof order.sampleType === "string" ? order.sampleType : undefined,
      stage: typeof order.stage === "string" ? order.stage : undefined,
      testName: typeof order.testName === "string" ? order.testName : undefined,
    })),
    patientVault: vault?.snapshot ? {
      familyMembers: vault.snapshot.familyMembers.length,
      uploadedReports: vault.snapshot.reports.filter((report) => report.source !== "lab").length,
    } : null,
    reports,
    tasks: tasks.map((task) => ({ ...task, source: "manual" })),
  };

  return NextResponse.json(payload);
}

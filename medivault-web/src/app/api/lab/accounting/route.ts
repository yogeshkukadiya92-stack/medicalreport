import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";

export const runtime = "nodejs";

type Invoice = {
  amount?: number;
  createdAt?: string;
  currency?: string;
  id?: string;
  patientName?: string;
  patientPhone?: string;
  paymentMode?: string;
  status?: string;
  testName?: string;
};

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const invoices = await context.db.collection<Invoice>("billingInvoices").find(
    { labId: context.lab.id },
    { projection: { _id: 0 } },
  ).sort({ createdAt: -1 }).limit(250).toArray();

  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const outstanding = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "void");
  const sum = (items: Invoice[]) => items.reduce((total, invoice) => total + (typeof invoice.amount === "number" ? invoice.amount : 0), 0);

  return NextResponse.json({
    invoices,
    lab: context.lab,
    metrics: {
      invoiceCount: invoices.length,
      outstandingAmount: sum(outstanding),
      paidAmount: sum(paid),
      totalAmount: sum(invoices),
    },
  });
}

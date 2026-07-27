import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import { billingMetrics } from "@/lib/billing-rules";

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

  return NextResponse.json({
    invoices,
    lab: context.lab,
    metrics: billingMetrics(invoices),
  });
}

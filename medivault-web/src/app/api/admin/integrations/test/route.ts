import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-server";
import { deliverWebhook, type IntegrationWebhook } from "@/lib/integration-server";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: NextRequest) {
  const context = await getAdminContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });
  const body = await request.json().catch(() => null) as { id?: string } | null;
  const webhook = await context.db.collection<IntegrationWebhook>("integrationWebhooks").findOne(
    { id: body?.id || "", labId: context.lab.id },
    { projection: { _id: 0 } },
  );
  if (!webhook) return NextResponse.json({ error: "Webhook was not found." }, { status: 404 });
  const result = await deliverWebhook(context.db, webhook, "lab.report.created", {
    client: { id: "test-client", name: "Test patient" },
    report: { id: "test-report", status: "draft", title: "Webhook test report" },
    test: true,
  });
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}

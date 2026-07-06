import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import { labTemplates } from "@/lib/lab-templates";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  return NextResponse.json({
    lab: context.lab,
    templates: labTemplates,
  });
}

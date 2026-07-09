import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import { getRazorpayPublicConfig } from "@/lib/razorpay";
import type { LabProfile, LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

type SettingsInput = {
  address?: string;
  name?: string;
  phone?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  return NextResponse.json({
    lab: context.lab,
    razorpay: getRazorpayPublicConfig(),
    role: context.labUser.role,
  });
}

export async function PATCH(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  if (context.labUser.role !== "lab_admin") {
    return NextResponse.json({ error: "Only lab admins can update lab settings." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as SettingsInput | null;
  const name = cleanText(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Lab name is required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Partial<LabProfile> = {
    address: cleanText(body?.address) || undefined,
    name,
    phone: cleanText(body?.phone) || undefined,
    updatedAt: now,
  };

  await context.db.collection<LabProfile>("labs").updateOne(
    { id: context.lab.id },
    {
      $set: patch,
    },
  );

  const lab = await context.db.collection<LabProfile>("labs").findOne({ id: context.lab.id }, { projection: { _id: 0 } });
  await context.db.collection<LabReport>("labReports").updateMany(
    { labId: context.lab.id },
    {
      $set: {
        labName: name,
      },
    },
  );

  return NextResponse.json({ lab });
}

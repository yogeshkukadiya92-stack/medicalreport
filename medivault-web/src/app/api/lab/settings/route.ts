import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import {
  supportedCountries,
  supportedCurrencies,
  supportedLocales,
  supportedTimeZones,
  type DataRegion,
  type MeasurementSystem,
} from "@/lib/region-config";
import type { LabProfile, LabReport } from "@/lib/vault-types";

export const runtime = "nodejs";

type SettingsInput = {
  address?: string;
  countryCode?: string;
  currency?: string;
  dataRegion?: DataRegion;
  locale?: string;
  measurementSystem?: MeasurementSystem;
  name?: string;
  phone?: string;
  timeZone?: string;
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
  const countryCode = cleanText(body?.countryCode).toUpperCase();
  const currency = cleanText(body?.currency).toUpperCase();
  const locale = cleanText(body?.locale);
  const timeZone = cleanText(body?.timeZone);
  const measurementSystem = body?.measurementSystem === "imperial" ? "imperial" : "metric";
  const dataRegion = ["india", "us", "eu", "asia-pacific"].includes(body?.dataRegion || "")
    ? body?.dataRegion
    : "india";
  if (!supportedCountries.some((country) => country.code === countryCode)) {
    return NextResponse.json({ error: "Select a supported country." }, { status: 400 });
  }
  if (!supportedCurrencies.includes(currency as (typeof supportedCurrencies)[number])) {
    return NextResponse.json({ error: "Select a supported currency." }, { status: 400 });
  }
  if (!supportedLocales.includes(locale as (typeof supportedLocales)[number])) {
    return NextResponse.json({ error: "Select a supported locale." }, { status: 400 });
  }
  if (!supportedTimeZones.includes(timeZone as (typeof supportedTimeZones)[number])) {
    return NextResponse.json({ error: "Select a supported timezone." }, { status: 400 });
  }
  const patch: Partial<LabProfile> = {
    address: cleanText(body?.address) || undefined,
    countryCode,
    currency,
    dataRegion,
    locale,
    measurementSystem,
    name,
    phone: cleanText(body?.phone) || undefined,
    timeZone,
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
  await context.db.collection("platformAuditLogs").insertOne({
    action: "lab_settings_updated",
    actorUserId: context.userId,
    createdAt: now,
    entityId: context.lab.id,
    entityType: "lab",
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    labId: context.lab.id,
    metadata: { countryCode, currency, dataRegion, locale, measurementSystem, name, timeZone },
  });

  return NextResponse.json({ lab });
}

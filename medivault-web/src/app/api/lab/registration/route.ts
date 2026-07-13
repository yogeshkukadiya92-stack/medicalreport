import { NextRequest, NextResponse } from "next/server";
import { getLabContext } from "@/lib/lab-server";
import { labTemplates } from "@/lib/lab-templates";

export const runtime = "nodejs";

const panelPrices: Record<string, number> = {
  "body-composition": 500,
  cbc: 350,
  diabetes: 650,
  "lipid-profile": 800,
  thyroid: 600,
};

export async function GET(request: NextRequest) {
  const context = await getLabContext(request);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const bookings = await context.db.collection("labOrders").find(
    { labId: context.lab.id, source: "online_booking" },
    { projection: { _id: 0 } },
  ).sort({ createdAt: -1 }).limit(50).toArray();

  return NextResponse.json({
    bookings,
    bookingUrl: context.lab.bookingSlug ? `/book/${context.lab.bookingSlug}` : "",
    lab: context.lab,
    panels: labTemplates.map((template) => ({
      category: template.category,
      id: template.id,
      name: template.name,
      price: panelPrices[template.id] ?? 500,
      tests: template.tests.length,
    })),
  });
}

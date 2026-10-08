import { NextResponse } from "next/server";
import { getMongoDb, isMongoConfigured } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { status: "unhealthy" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });

    return NextResponse.json(
      { status: "ok" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unhealthy" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

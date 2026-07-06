import { NextResponse } from "next/server";
import { safeSupabasePublicKey } from "@/lib/supabase-key";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = safeSupabasePublicKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

  return NextResponse.json(
    {
      isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
      supabaseAnonKey,
      supabaseUrl,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

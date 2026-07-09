import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, destroyAuthSession } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await destroyAuthSession(request);
  const response = NextResponse.json({ signedOut: true });
  clearAuthCookie(response);
  return response;
}

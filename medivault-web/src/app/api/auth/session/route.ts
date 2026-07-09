import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ isConfigured: false, user: null });
  }

  const user = await getAuthenticatedUser(request);
  return NextResponse.json({
    isConfigured: true,
    user,
  });
}

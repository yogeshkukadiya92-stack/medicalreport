import { NextRequest, NextResponse } from "next/server";
import { isTestingAuthOtpEnabled } from "@/lib/auth-server";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

type OtpRequestInput = {
  phone?: string;
  purpose?: "login" | "reset" | "signup";
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(clientKey(request, "auth-request-otp"), { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many OTP requests. Try again after a few minutes." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const body = (await request.json().catch(() => null)) as OtpRequestInput | null;
  const phone = (body?.phone ?? "").replace(/\D/g, "");
  if (phone.length < 10) {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }

  if (!isTestingAuthOtpEnabled()) {
    return NextResponse.json(
      { error: "OTP delivery is not configured. Sign in with your password or contact the administrator." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    message: "Development OTP is ready.",
    purpose: body?.purpose ?? "login",
  });
}

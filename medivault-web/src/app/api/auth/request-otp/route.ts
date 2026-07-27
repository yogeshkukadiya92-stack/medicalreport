import { NextRequest, NextResponse } from "next/server";
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

  // Replace this testing response with an SMS provider call when production OTP delivery is connected.
  return NextResponse.json({
    message: "OTP sent. Use 1111 for testing.",
    purpose: body?.purpose ?? "login",
  });
}

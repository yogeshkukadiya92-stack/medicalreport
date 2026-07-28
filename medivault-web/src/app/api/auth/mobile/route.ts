import { NextRequest, NextResponse } from "next/server";
import {
  loginAuthUserSession,
  loginAuthUserSessionWithOtp,
  resetAuthUserPasswordWithOtp,
} from "@/lib/auth-server";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

type MobileAuthInput = {
  action?: "login" | "otp_login" | "reset_password";
  otp?: string;
  password?: string;
  phone?: string;
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(clientKey(request, "mobile-auth"), { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many authentication attempts. Try again later." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const body = await request.json().catch(() => null) as MobileAuthInput | null;
  const action = body?.action ?? "login";
  try {
    const result = action === "otp_login"
      ? await loginAuthUserSessionWithOtp({ otp: body?.otp ?? "", phone: body?.phone ?? "" })
      : action === "reset_password"
        ? await resetAuthUserPasswordWithOtp({
          otp: body?.otp ?? "",
          password: body?.password ?? "",
          phone: body?.phone ?? "",
        })
        : await loginAuthUserSession({ password: body?.password ?? "", phone: body?.phone ?? "" });
    return NextResponse.json({
      accessToken: result.token,
      expiresIn: 60 * 60 * 24 * 30,
      tokenType: "Bearer",
      user: result.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    return NextResponse.json({ error: message }, { status: message.includes("MongoDB") ? 503 : 401 });
  }
}

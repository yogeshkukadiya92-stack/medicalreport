import { NextRequest, NextResponse } from "next/server";
import { resetAuthUserPasswordWithOtp, setAuthCookie } from "@/lib/auth-server";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

type ResetPasswordInput = {
  otp?: string;
  password?: string;
  phone?: string;
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(clientKey(request, "auth-reset-password"), { limit: 5, windowMs: 30 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reset attempts. Try again later." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const body = (await request.json().catch(() => null)) as ResetPasswordInput | null;
  try {
    const { token, user } = await resetAuthUserPasswordWithOtp({
      otp: body?.otp ?? "",
      password: body?.password ?? "",
      phone: body?.phone ?? "",
    });
    const response = NextResponse.json({ user });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password could not be reset.";
    const status = message.includes("MongoDB") ? 503 : message.includes("No account") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

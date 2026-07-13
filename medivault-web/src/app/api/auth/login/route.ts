import { NextRequest, NextResponse } from "next/server";
import { loginAuthUserSession, setAuthCookie } from "@/lib/auth-server";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

type LoginInput = {
  email?: string;
  password?: string;
  phone?: string;
};

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(clientKey(request, "auth-login"), { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again after a few minutes." }, { status: 429, headers: rateLimitHeaders(rateLimit) });
  }

  const body = (await request.json().catch(() => null)) as LoginInput | null;
  try {
    const { token, user } = await loginAuthUserSession({
      password: body?.password ?? "",
      phone: body?.phone ?? body?.email ?? "",
    });
    const response = NextResponse.json({ user });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed.";
    const status = message.includes("MongoDB") ? 503 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

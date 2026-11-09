import { NextRequest, NextResponse } from "next/server";
import { createEmailAuthUserSession, setAuthCookie } from "@/lib/auth-server";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(clientKey(request, "email-registration"), { limit: 5, windowMs: 30 * 60 * 1000 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429, headers: rateLimitHeaders(limit) });
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || typeof body?.password !== "string" || body.email.length > 254 || body.password.length > 256) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  try {
    const result = await createEmailAuthUserSession({ email: body.email, password: body.password, name: typeof body.name === "string" ? body.name.slice(0, 80) : undefined });
    const response = NextResponse.json({ accessToken: result.token, expiresIn: 60 * 60 * 24 * 30, tokenType: "Bearer", user: result.user }, { status: 201 });
    setAuthCookie(response, result.token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Your account could not be created.";
    const duplicate = message.includes("already exists") || (error as { code?: number }).code === 11000;
    return NextResponse.json({ error: duplicate ? "An account with this email already exists. Sign in instead." : message }, { status: duplicate ? 409 : message.includes("MongoDB") ? 503 : 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { loginAuthUserSession, setAuthCookie } from "@/lib/auth-server";

export const runtime = "nodejs";

type LoginInput = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LoginInput | null;
  try {
    const { token, user } = await loginAuthUserSession({
      email: body?.email ?? "",
      password: body?.password ?? "",
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

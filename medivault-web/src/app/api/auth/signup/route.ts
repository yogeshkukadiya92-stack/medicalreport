import { NextRequest, NextResponse } from "next/server";
import { createAuthUserSession, setAuthCookie } from "@/lib/auth-server";

export const runtime = "nodejs";

type SignupInput = {
  email?: string;
  name?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SignupInput | null;
  try {
    const { token, user } = await createAuthUserSession({
      email: body?.email ?? "",
      name: body?.name,
      password: body?.password ?? "",
    });
    const response = NextResponse.json({ user });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account could not be created.";
    const status = message.includes("already exists") ? 409 : message.includes("MongoDB") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

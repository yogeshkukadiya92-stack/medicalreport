import { NextRequest, NextResponse } from "next/server";
import { createAuthUserSession, setAuthCookie } from "@/lib/auth-server";

export const runtime = "nodejs";

type SignupInput = {
  email?: string;
  name?: string;
  otp?: string;
  password?: string;
  phone?: string;
};

const testingSignupOtp = "1111";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SignupInput | null;
  try {
    if ((body?.otp ?? "").trim() !== testingSignupOtp) {
      return NextResponse.json({ error: "Invalid OTP. Use 1111 for testing." }, { status: 400 });
    }

    const { token, user } = await createAuthUserSession({
      email: body?.email ?? "",
      name: body?.name,
      password: body?.password ?? "",
      phone: body?.phone ?? "",
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

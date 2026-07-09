import { clearAccessToken, setAccessToken } from "@/lib/api-client";
import type { LoginResponse } from "@/lib/types";

const phoneOtpMessage = "Phone OTP auth is not configured. Use the MongoDB email and password login page.";

export const authAPI = {
  async sendOTP(_phone: string) {
    throw new Error(phoneOtpMessage);
  },

  async verifyOTP(_phone: string, _otp: string): Promise<LoginResponse> {
    throw new Error(phoneOtpMessage);
  },

  async refreshToken(_refreshToken: string): Promise<string> {
    throw new Error("Token refresh is handled by MongoDB cookie sessions.");
  },

  async logout(_refreshToken?: string): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    clearAccessToken();
  },

  setBearerToken(token: string) {
    setAccessToken(token);
  },
};

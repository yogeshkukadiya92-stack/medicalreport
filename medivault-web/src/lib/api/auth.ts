import { clearAccessToken, setAccessToken } from "@/lib/api-client";
import type { LoginResponse } from "@/lib/types";

const phoneOtpMessage = "Phone OTP auth is not configured. Use the Supabase email or magic-link login page.";

export const authAPI = {
  async sendOTP(_phone: string) {
    throw new Error(phoneOtpMessage);
  },

  async verifyOTP(_phone: string, _otp: string): Promise<LoginResponse> {
    throw new Error(phoneOtpMessage);
  },

  async refreshToken(_refreshToken: string): Promise<string> {
    throw new Error("Token refresh is handled by Supabase Auth in the browser session.");
  },

  async logout(_refreshToken?: string): Promise<void> {
    clearAccessToken();
  },

  setBearerToken(token: string) {
    setAccessToken(token);
  },
};

// Auth API Service — talks to the MediVault backend.
import type { LoginResponse } from '@/lib/types';
import apiClient, { setAccessToken, clearAccessToken } from '@/lib/api-client';

export const authAPI = {
  // Send OTP to phone. In dev mode the backend returns `dev_otp`.
  async sendOTP(phone: string) {
    const res = await apiClient.post('/auth/otp/send', { phone });
    return res.data; // { success, data: { phone, otp_expiry_seconds, is_new_user, dev_otp? } }
  },

  // Verify OTP, store the access token, and return login state.
  async verifyOTP(phone: string, otp: string): Promise<LoginResponse> {
    const res = await apiClient.post('/auth/otp/verify', { phone, otp });
    const data = res.data.data as LoginResponse;
    if (data.access_token) {
      setAccessToken(data.access_token);
    }
    return data;
  },

  // Get the currently authenticated user.
  async me() {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },

  // Logout — revoke server-side (best effort) and clear local token.
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      clearAccessToken();
    }
  },
};

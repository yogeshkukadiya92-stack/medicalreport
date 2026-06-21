// Auth API Service
// MVP: Returns dummy data. Replace fetch calls with apiClient when backend is ready.

import type { LoginResponse, User } from '@/lib/types';
import { dummyUser } from '@/data/dummy';

export const authAPI = {
  // Send OTP to phone
  async sendOTP(phone: string) {
    // TODO: Replace with real API call
    // return apiClient.post('/auth/otp/send', { phone });

    return Promise.resolve({
      data: {
        phone,
        otp_expiry_seconds: 300,
        is_new_user: true,
      },
    });
  },

  // Verify OTP and login
  async verifyOTP(phone: string, otp: string): Promise<LoginResponse> {
    // TODO: Replace with real API call
    // const response = await apiClient.post('/auth/otp/verify', { phone, otp });
    // return response.data.data;

    // Dummy implementation
    return {
      access_token: `token_${Date.now()}`,
      user: dummyUser,
      is_new_user: false,
      has_profile: true,
      has_consent: true,
    };
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<string> {
    // TODO: Replace with real API call
    // const response = await apiClient.post('/auth/token/refresh', { refresh_token: refreshToken });
    // return response.data.data.access_token;

    return `token_${Date.now()}`;
  },

  // Logout
  async logout(refreshToken: string): Promise<void> {
    // TODO: Replace with real API call
    // await apiClient.post('/auth/logout', { refresh_token: refreshToken });

    return Promise.resolve();
  },
};

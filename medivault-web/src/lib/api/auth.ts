// Auth API Service — uses Supabase for OTP + session management.
// The Supabase access token is automatically forwarded to the backend
// via the onAuthStateChange listener in supabase.ts.
import { supabase } from '@/lib/supabase';
import { clearAccessToken } from '@/lib/api-client';

export const authAPI = {
  // Step 1: Send OTP to phone via Supabase.
  // Requires Phone Auth enabled in Supabase dashboard + SMS provider.
  async sendOTP(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    return { success: true };
  },

  // Step 2: Verify OTP — Supabase returns a session with access_token.
  async verifyOTP(phone: string, otp: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });
    if (error) throw error;
    return data; // { user, session }
  },

  // Get current Supabase session.
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // Get current user from Supabase.
  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  // Logout from Supabase and clear local token.
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    clearAccessToken();
  },
};

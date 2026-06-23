// Auth API — email/password auth via Supabase.
// The Supabase access token is synced to the backend client automatically
// via the onAuthStateChange listener in supabase.ts.
import { supabase } from '@/lib/supabase';
import { clearAccessToken } from '@/lib/api-client';

export const authAPI = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async forgotPassword(email: string) {
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  async resetPassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    clearAccessToken();
  },
};

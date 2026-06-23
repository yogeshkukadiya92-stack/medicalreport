// Supabase client — configured from environment variables.
// Sets up auto token sync with the API client on auth state change.
import { createClient } from '@supabase/supabase-js';
import { setAccessToken, clearAccessToken } from '@/lib/api-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Keep API client token in sync with Supabase session (including auto-refreshes).
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      setAccessToken(session.access_token);
    } else {
      clearAccessToken();
    }
  });
}

export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

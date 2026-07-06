"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient, loadPublicConfig } from "@/lib/supabase";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  isConfigLoading: boolean;
  isConfigured: boolean;
  session: Session | null;
  status: AuthStatus;
  supabase: SupabaseClient | null;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function configureAuth() {
      setIsConfigLoading(true);
      const config = await loadPublicConfig();
      if (!mounted) return;

      const client = createSupabaseBrowserClient(config);
      setIsConfigured(Boolean(client));
      setSupabase(client);
      setIsConfigLoading(false);

      if (!client) {
        setSession(null);
        setStatus("unauthenticated");
        return;
      }

      const { data } = await client.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "unauthenticated");

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setStatus(nextSession ? "authenticated" : "unauthenticated");
      });

      unsubscribe = () => subscription.unsubscribe();
    }

    configureAuth();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigLoading,
      isConfigured,
      session,
      status,
      supabase,
      user: session?.user ?? null,
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
      },
    }),
    [isConfigLoading, isConfigured, session, status, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAccessToken, setAccessToken } from "@/lib/api-client";
import type { AuthUser } from "@/lib/auth-server";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type MongoSession = {
  access_token: string;
  user: AuthUser;
};

type AuthContextValue = {
  isConfigLoading: boolean;
  isConfigured: boolean;
  session: MongoSession | null;
  status: AuthStatus;
  user: AuthUser | null;
  login: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signup: (input: { email: string; otp: string; password: string; phone: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const cookieBackedToken = "mongo-cookie-session";

type SessionResponse = {
  error?: string;
  isConfigured?: boolean;
  user?: AuthUser | null;
};

function buildSession(user: AuthUser): MongoSession {
  return {
    access_token: cookieBackedToken,
    user,
  };
}

async function readJsonResponse(response: Response) {
  return (await response.json().catch(() => null)) as SessionResponse | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [session, setSession] = useState<MongoSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  async function refreshSession() {
    setIsConfigLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const result = await readJsonResponse(response);
      const configured = Boolean(result?.isConfigured);
      setIsConfigured(configured);

      if (response.ok && configured && result?.user) {
        const nextSession = buildSession(result.user);
        setSession(nextSession);
        setAccessToken(nextSession.access_token);
        setStatus("authenticated");
      } else {
        setSession(null);
        clearAccessToken();
        setStatus("unauthenticated");
      }
    } catch {
      setIsConfigured(false);
      setSession(null);
      clearAccessToken();
      setStatus("unauthenticated");
    } finally {
      setIsConfigLoading(false);
    }
  }

  async function submitAuth(endpoint: "/api/auth/login" | "/api/auth/signup", input: { email?: string; otp?: string; password: string; phone?: string }) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const result = await readJsonResponse(response);
    if (!response.ok || !result?.user) {
      throw new Error(result?.error ?? "Authentication failed.");
    }

    const nextSession = buildSession(result.user);
    setIsConfigured(true);
    setSession(nextSession);
    setAccessToken(nextSession.access_token);
    setStatus("authenticated");
  }

  useEffect(() => {
    refreshSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigLoading,
      isConfigured,
      session,
      status,
      user: session?.user ?? null,
      login: async (phone, password) => submitAuth("/api/auth/login", { password, phone }),
      signup: async (input) => submitAuth("/api/auth/signup", input),
      signOut: async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        setSession(null);
        clearAccessToken();
        setStatus("unauthenticated");
      },
    }),
    [isConfigLoading, isConfigured, session, status],
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

"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PublicConfig = {
  isSupabaseConfigured: boolean;
  supabaseAnonKey: string;
  supabaseUrl: string;
};

const buildTimeConfig: PublicConfig = {
  isSupabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
};

function normalizeConfig(input: Partial<PublicConfig> | null): PublicConfig {
  const supabaseUrl = typeof input?.supabaseUrl === "string" ? input.supabaseUrl : "";
  const supabaseAnonKey = typeof input?.supabaseAnonKey === "string" ? input.supabaseAnonKey : "";
  return {
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseAnonKey,
    supabaseUrl,
  };
}

export async function loadPublicConfig(): Promise<PublicConfig> {
  try {
    const response = await fetch("/api/public-config", { cache: "no-store" });
    if (!response.ok) return buildTimeConfig;
    return normalizeConfig((await response.json().catch(() => null)) as Partial<PublicConfig> | null);
  } catch {
    return buildTimeConfig;
  }
}

export function createSupabaseBrowserClient(config: PublicConfig): SupabaseClient | null {
  return config.isSupabaseConfigured
    ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
}

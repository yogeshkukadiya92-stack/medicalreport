"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { safeSupabasePublicKey } from "@/lib/supabase-key";

export type PublicConfig = {
  isSupabaseConfigured: boolean;
  supabaseAnonKey: string;
  supabaseUrl: string;
};

const publicConfigTimeoutMs = 8000;

const buildTimeConfig: PublicConfig = {
  isSupabaseConfigured: false,
  supabaseAnonKey: "",
  supabaseUrl: "",
};

function normalizeConfig(input: Partial<PublicConfig> | null): PublicConfig {
  const supabaseUrl = typeof input?.supabaseUrl === "string" ? input.supabaseUrl : "";
  const supabaseAnonKey = safeSupabasePublicKey(typeof input?.supabaseAnonKey === "string" ? input.supabaseAnonKey : "");
  return {
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseAnonKey,
    supabaseUrl,
  };
}

export async function loadPublicConfig(): Promise<PublicConfig> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), publicConfigTimeoutMs);
  try {
    const response = await fetch("/api/public-config", { cache: "no-store", signal: controller.signal });
    if (!response.ok) return buildTimeConfig;
    return normalizeConfig((await response.json().catch(() => null)) as Partial<PublicConfig> | null);
  } catch {
    return buildTimeConfig;
  } finally {
    window.clearTimeout(timeout);
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

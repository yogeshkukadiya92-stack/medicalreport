import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeSupabasePublicKey } from "@/lib/supabase-key";

export async function getAuthenticatedUserId(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = safeSupabasePublicKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  if (!supabaseUrl || !supabaseAnonKey || !token) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

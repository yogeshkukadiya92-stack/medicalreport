const unsafePublicRoles = new Set(["service_role", "supabase_admin"]);

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  if (typeof atob !== "undefined") {
    return atob(padded);
  }

  return "";
}

export function getSupabaseJwtRole(value: string) {
  const payload = value.split(".")[1];
  if (!payload) return "";

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as { role?: unknown };
    return typeof parsed.role === "string" ? parsed.role : "";
  } catch {
    return "";
  }
}

export function isUnsafeSupabasePublicKey(value: string) {
  const role = getSupabaseJwtRole(value);
  return unsafePublicRoles.has(role);
}

export function safeSupabasePublicKey(value: string) {
  return isUnsafeSupabasePublicKey(value) ? "" : value;
}

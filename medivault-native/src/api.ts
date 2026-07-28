import Constants from "expo-constants";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL
  || (Constants.expoConfig?.extra?.apiUrl as string | undefined)
  || "https://mr.yogeshaihub.in/api";

export const API_URL = configuredUrl.replace(/\/$/, "");

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const result = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok) throw new Error(result?.error || `Request failed (${response.status}).`);
  return result as T;
}

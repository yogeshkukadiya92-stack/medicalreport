import Constants from "expo-constants";

const configuredUrl = process.env.EXPO_PUBLIC_API_URL
  || (Constants.expoConfig?.extra?.apiUrl as string | undefined)
  || "https://mr.yogeshaihub.in/api";

export const API_URL = configuredUrl.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 65_000);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: options.signal || controller.signal });
    const result = await response.json().catch((error) => {
      if (controller.signal.aborted) throw error;
      return null;
    }) as (T & { error?: string }) | null;
    if (!response.ok) throw new ApiError(result?.error || (
      [504, 524].includes(response.status)
        ? "The server took too long to process the report. If the original was saved, retry extraction from Reports."
        : `Request failed (${response.status}).`
    ), response.status);
    return result as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ApiError("The server took too long to respond. Check Reports before retrying the upload.", 408);
    }
    throw error;
  } finally { clearTimeout(timer); }
}

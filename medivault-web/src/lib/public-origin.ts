/** Resolve public links behind the deployment's reverse proxy. */
export function publicOrigin(request: { headers: Headers; nextUrl: URL }, configured = process.env.APP_PUBLIC_URL) {
  if (configured) return new URL(configured).origin;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
  const protocol = (request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")).split(",")[0].trim();
  if (host && /^(https?)$/.test(protocol) && /^[a-zA-Z0-9.:[\]-]+$/.test(host)) {
    try { return new URL(`${protocol}://${host}`).origin; } catch { /* Fall back to the request URL. */ }
  }
  return request.nextUrl.origin;
}

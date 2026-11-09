const { getDefaultConfig } = require("expo/metro-config");
const http = require("node:http");
const https = require("node:https");

const config = getDefaultConfig(__dirname);
// Keep browser development requests on the Expo origin. Native builds use the API directly.
config.server.enhanceMiddleware = (metroMiddleware) => (req, res, next) => {
  if (!req.url.startsWith("/api/")) return metroMiddleware(req, res, next);
  const base = process.env.MEDIVAULT_DEV_API_URL || process.env.EXPO_PUBLIC_API_URL || "https://mr.yogeshaihub.in/api";
  const target = new URL(base.replace(/\/$/, "") + req.url.slice(4));
  const transport = target.protocol === "https:" ? https : http;
  const headers = { ...req.headers, host: target.host };
  delete headers.origin;
  const upstream = transport.request(target, { method: req.method, headers }, (response) => {
    res.writeHead(response.statusCode, { ...response.headers, "cache-control": "no-store" });
    response.pipe(res);
  });
  upstream.setTimeout(70000, () => upstream.destroy(new Error("API timeout")));
  upstream.on("error", () => {
    if (res.headersSent) return res.destroy();
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "The API could not be reached. Please try again." }));
  });
  req.pipe(upstream);
};
module.exports = config;

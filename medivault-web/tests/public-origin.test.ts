import assert from "node:assert/strict";
import test from "node:test";
import { publicOrigin } from "../src/lib/public-origin";

test("shared links use the public reverse proxy address instead of the container address", () => {
  const request = { headers: new Headers({ "x-forwarded-host": "vault.example.test", "x-forwarded-proto": "https", host: "0.0.0.0:3000" }), nextUrl: new URL("http://0.0.0.0:3000/api/shares") };
  assert.equal(publicOrigin(request, ""), "https://vault.example.test");
  assert.equal(publicOrigin(request, "https://configured.example.test/base"), "https://configured.example.test");
});

test("origin handles direct requests and rejects malformed proxy addresses", () => {
  const request = { headers: new Headers(), nextUrl: new URL("http://localhost:3300/api/shares") };
  assert.equal(publicOrigin(request, ""), "http://localhost:3300");
  request.headers.set("x-forwarded-host", "example.test/redirect");
  assert.equal(publicOrigin(request, ""), "http://localhost:3300");
});

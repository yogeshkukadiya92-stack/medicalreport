import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const uploadSource = readFileSync(new URL("../app/(tabs)/upload.tsx", import.meta.url), "utf8");
const reportsSource = readFileSync(new URL("../app/(tabs)/reports.tsx", import.meta.url), "utf8");

test("PDF uploads render a page before invoking report analysis", () => {
  assert.match(uploadSource, /isPdf[\s\S]*documentScanner\.enhanceImage\(file\.uri\)/);
  assert.match(uploadSource, /mimeType: analysisFile\.mimeType/);
  assert.match(uploadSource, /originalMimeType: file\.mimeType/);
});

test("stored report files expose an authenticated native preview action", () => {
  assert.match(reportsSource, /previewRemoteFile\([\s\S]*API_URL.*\/files\//);
  assert.match(reportsSource, /accessibilityLabel="Open original report"/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const uploadSource = readFileSync(new URL("../app/(tabs)/upload.tsx", import.meta.url), "utf8");
const reportsSource = readFileSync(new URL("../app/(tabs)/reports.tsx", import.meta.url), "utf8");

test("uploads and retries share Android-compatible report preparation", () => {
  assert.match(uploadSource, /prepareReportAnalysis\(file, stored.fileId\)/);
  assert.match(reportsSource, /prepareReportAnalysis\(file, stored.fileId\)/);
});

test("stored report files expose an authenticated native preview action", () => {
  assert.match(reportsSource, /previewRemoteFile\([\s\S]*API_URL.*\/files\//);
  assert.match(reportsSource, /accessibilityLabel="Open original report"/);
});

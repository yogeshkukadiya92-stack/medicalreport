import assert from "node:assert/strict";
import test from "node:test";
import { measuredMarkers, normalizeReport } from "../src/report-analysis";
import type { AppReport } from "../src/types";

test("upload placeholders never count as measured biomarkers or successful analysis", () => {
  const report = normalizeReport({ markers: [{ name: "Report", value: "Uploaded", range: "Needs review", status: "Watch" }], status: "Reviewed", parameters: 1, abnormal: 1 } as AppReport);
  assert.equal(report.parameters, 0);
  assert.equal(report.abnormal, 0);
  assert.equal(report.status, "Needs review");
});
test("qualitative lab results and measured body composition values remain intact", () => {
  const markers = [{ name: "Weight", value: "67.7 kg", range: "", status: "Normal" as const }, { name: "HIV", value: "Negative", range: "", status: "Normal" as const }];
  assert.deepEqual(measuredMarkers(markers), markers);
});
test("extraction failure retains its actionable reason and attached source", () => {
  const report = normalizeReport({ fileId: "owned-file", markers: [], status: "Needs review", summary: "PDF extraction requires the latest build." } as AppReport);
  assert.equal(report.fileId, "owned-file");
  assert.equal(report.summary, "PDF extraction requires the latest build.");
});

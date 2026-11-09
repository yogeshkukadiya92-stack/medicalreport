import assert from "node:assert/strict";
import test from "node:test";
import { matchesReportSearch } from "../src/report-search";
import type { AppReport } from "../src/types";
const report = { title: "Blood count", lab: "City Lab", category: "Hematology", markers: [{ name: "Hemoglobin", value: "12", range: "12–16", status: "Normal" }] } as AppReport;
test("report search finds biomarkers and tolerates whitespace and case", () => {
  assert.equal(matchesReportSearch(report, "  HEMOGLOBIN  "), true);
  assert.equal(matchesReportSearch(report, "city blood"), true);
  assert.equal(matchesReportSearch(report, "   "), true);
  assert.equal(matchesReportSearch(report, "cholesterol"), false);
});

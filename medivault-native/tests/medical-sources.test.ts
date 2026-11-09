import assert from "node:assert/strict";
import test from "node:test";
import { bmiSource, labResultsSource, medicalSourcesForReport } from "../src/medical-sources";

test("reports cite lab-result education without inventing patient-specific references", () => {
  assert.deepEqual(medicalSourcesForReport({ title: "Blood count", category: "General", markers: [] }), [labResultsSource]);
  assert.equal(new URL(labResultsSource.url).hostname, "medlineplus.gov");
});

test("body composition and BMI observations also cite BMI limitations", () => {
  for (const report of [{ title: "InBody", category: "General", markers: [] }, { title: "Report", category: "General", markers: [{ name: "BMI" }] }]) {
    assert.deepEqual(medicalSourcesForReport(report), [labResultsSource, bmiSource]);
  }
  assert.equal(new URL(bmiSource.url).hostname, "www.cdc.gov");
});

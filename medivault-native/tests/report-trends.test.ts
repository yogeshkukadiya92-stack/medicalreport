import assert from "node:assert/strict";
import test from "node:test";
import { buildReportTrends, numericReading } from "../src/report-trends";

test("medical trends never compare different measurement units", () => {
  const trends = buildReportTrends([
    { date: "2026-01-01", markers: [{ name: "Glucose", value: "90 mg/dL", status: "Normal", range: "" }] },
    { date: "2026-02-01", markers: [{ name: "Glucose", value: "5 mmol/L", status: "Normal", range: "" }] },
  ]);
  assert.equal(trends.length, 2);
  assert.ok(trends.every(trend => trend.points.length === 1));
});

test("equivalent unit typography keeps one chronological series", () => {
  const trends = buildReportTrends([
    { date: "2026-02-01", markers: [{ name: "Vitamin B12", value: "310 µg/L", status: "Normal", range: "" }] },
    { date: "2026-01-01", markers: [{ name: "vitamin b12", value: "300 μg / L", status: "Normal", range: "" }] },
  ]);
  assert.equal(trends.length, 1);
  assert.deepEqual(trends[0].points.map(point => point.value), [300, 310]);
});

test("inequalities and qualitative grades do not become exact chart values", () => {
  for (const text of ["<5 mg/dL", ">100", "Grade 1", "Negative", "5,2 mmol/L", "120/80 mmHg", "13.5.4", "3+"]) assert.equal(numericReading(text), null);
});

test("printed thousands separators and scientific notation remain readable", () => {
  assert.equal(numericReading("1,250 cells/µL")?.value, 1250);
  assert.equal(numericReading("1.2e3 cells/uL")?.value, 1200);
});

import assert from "node:assert/strict";
import test from "node:test";
import { bodyOcrMetrics, numberAfterLabel } from "../src/lib/body-ocr-metrics";
const value = (name: string, lines: string[]) => numberAfterLabel(lines, bodyOcrMetrics.find(metric => metric.name === name)!);

test("plain weight labels are extracted without confusing target or control values", () => {
  assert.equal(value("Weight", ["Target Weight: 65 kg", "Weight Control: -5 kg", "Weight: 70.0 kg"]), "70");
  assert.equal(value("Weight", ["Body Weight (kg) 70.0"]), "70");
  assert.equal(value("Weight", ["Target Weight: 65 kg", "Weight Control: -5 kg"]), "");
  assert.equal(value("Target Weight", ["Target Weight: 65 kg"]), "65");
  assert.equal(value("Weight Control", ["Weight Control: -5 kg"]), "-5");
});
test("legacy InBody weight labels continue to work", () => {
  assert.equal(value("Weight", ["Sum of the above Weight (kg) 70.0"]), "70");
});
test("integer percentages and abbreviated BMI labels keep printed values", () => {
  assert.equal(value("PBF", ["PBF: 20 %"]), "20");
  assert.equal(value("PBF", ["Percent Body Fat: 20.0 %"]), "20");
  assert.equal(value("PBF", ["Percent Body Fat 20 40 60"]), "");
  assert.equal(value("BMI", ["BMI: 22.9 kg/m2"]), "22.9");
});
test("OCR never multiplies incomplete metabolic measurements", () => {
  assert.equal(value("Basal Metabolic Rate", ["BMR: 17 kcal"]), "17");
  assert.equal(value("Basal Metabolic Rate", ["BMR: 1700 kcal"]), "1700");
});

import assert from "node:assert/strict";
import test from "node:test";
import { isBodyCompositionReport } from "../src/lib/report-kind";

test("InBody original filename activates OCR despite enhanced title and medical selection", () => {
  assert.equal(isBodyCompositionReport({ title: "enhanced-report-2F17DE0E", fileName: "94299865061_20260913084915_InBody.jpg", reportKind: "medical" }), true);
});
test("ordinary medical report does not become body composition", () => {
  assert.equal(isBodyCompositionReport({ title: "CBC", fileName: "blood-test.pdf", reportKind: "medical" }), false);
});

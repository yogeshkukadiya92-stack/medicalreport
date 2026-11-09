import assert from "node:assert/strict";
import test from "node:test";
import { isValidLoginIdentifier, normalizeLoginIdentifier } from "../src/login-identifier";

test("password login preserves an email instead of converting it to a phone number", () => {
  assert.equal(normalizeLoginIdentifier(" YogeshKukadiya92@gmail.com "), "yogeshkukadiya92@gmail.com");
  assert.equal(isValidLoginIdentifier("yogeshkukadiya92@gmail.com"), true);
});

test("password and OTP login normalize an Indian mobile number", () => {
  assert.equal(normalizeLoginIdentifier("98765 43210"), "+919876543210");
  assert.equal(isValidLoginIdentifier("9876543210"), true);
  assert.equal(isValidLoginIdentifier("98765"), false);
});


test("mobile validation rejects foreign prefixes, extra digits and letters instead of silently changing the number", () => {
  assert.equal(isValidLoginIdentifier("+91 98765 43210"), true);
  for (const value of ["+1 9876543210", "9999876543210", "abc9876543210", "1234567890", "98765432101"]) {
    assert.equal(isValidLoginIdentifier(value), false, value);
  }
});

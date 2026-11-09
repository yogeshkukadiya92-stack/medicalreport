import assert from 'node:assert/strict';
import test from 'node:test';
import { testingOtpAllowed } from '../src/lib/testing-otp-policy';
const configured = { NODE_ENV: 'production', AUTH_TEST_LOGIN_ENABLED: 'true', AUTH_TEST_PHONE_NUMBERS: '9876543210' };
test('production testing OTP denies missing opt-in and missing allowlist', () => {
  assert.equal(testingOtpAllowed('9876543210', 'login', { NODE_ENV: 'production' }), false);
  assert.equal(testingOtpAllowed('9876543210', 'login', { ...configured, AUTH_TEST_PHONE_NUMBERS: '' }), false);
  assert.equal(testingOtpAllowed('9876543210', 'login', { ...configured, AUTH_TEST_LOGIN_ENABLED: 'false' }), false);
});
test('production test login matches only exact normalized phone', () => {
  assert.equal(testingOtpAllowed('+91 9876543210', 'login', configured), true);
  assert.equal(testingOtpAllowed('9876543211', 'login', configured), false);
  assert.equal(testingOtpAllowed('98765432101', 'login', configured), false);
});
test('production test OTP cannot reset passwords or sign up accounts', () => {
  for (const purpose of ['reset', 'signup', '']) assert.equal(testingOtpAllowed('9876543210', purpose, configured), false);
});
test('development testing stays enabled', () => {
  assert.equal(testingOtpAllowed('', 'login', { NODE_ENV: 'development' }), true);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { accountPatientPhone } from '../src/lib/patient-report-access';
import { findOwnedReport } from '../src/lib/secure-share';

test('patient report identity comes from the active account', async () => {
  for (const account of [null, { phone: '' }, { phone: '9876543210', accountStatus: 'suspended' }]) {
    const db = { collection: () => ({ findOne: async () => account }) };
    assert.equal(await accountPatientPhone(db as never, 'owner'), '');
  }
  const db = { collection: () => ({ findOne: async () => ({ phone: '+91 9876543210', accountStatus: 'active' }) }) };
  assert.equal(await accountPatientPhone(db as never, 'owner'), '9876543210');
});

test('a typed family contact cannot authorize sharing another patient report', async () => {
  const db = { collection(name: string) { return { async findOne() {
    if (name === 'authUsers') return { phone: '9876543210' };
    if (name === 'vaults') return { snapshot: { reports: [], familyMembers: [{ id: 'other', name: 'Other', phone: '9876543211' }] } };
    throw new Error('Unverified family number must never reach laboratory report lookup');
  } }; } };
  assert.equal(await findOwnedReport(db as never, 'owner', 'lab-other'), null);
});

test('the primary account can still share its published laboratory report', async () => {
  const db = { collection(name: string) { return { async findOne(query: Record<string, unknown>) {
    if (name === 'authUsers') return { phone: '9876543210' };
    if (name === 'vaults') return { snapshot: { reports: [], familyMembers: [
      { id: 'self', name: 'Self', phone: '+91 9876543210' }, { id: 'other', name: 'Other', phone: '9876543211' },
    ] } };
    assert.equal(name, 'labReports');
    assert.deepEqual(query.normalizedClientPhone, { $in: ['9876543210'] });
    return { id: 'own', title: 'Owned report', normalizedClientPhone: '9876543210', values: [], createdAt: '2026-01-01', parameters: 0 };
  } }; } };
  assert.equal((await findOwnedReport(db as never, 'owner', 'lab-own'))?.memberId, 'self');
});

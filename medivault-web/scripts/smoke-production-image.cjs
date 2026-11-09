const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.QA_API_URL || 'http://127.0.0.1:3300/api';
const phone = '9876543210';
(async () => {
  let healthy = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { healthy = (await fetch(base + '/health', { signal: AbortSignal.timeout(3000) })).ok; } catch {}
    if (healthy) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(healthy, 'Production container must become healthy');
  const login = await fetch(base + '/auth/mobile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'otp_login', phone, otp: '1111' }) });
  assert.equal(login.status, 200);
  const { accessToken } = await login.json();
  assert.ok(accessToken);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const vault = { activeMemberId: 'ci-self', reports: [], familyMembers: [
    { id: 'ci-self', name: 'Synthetic self', relation: 'Self', age: 30, score: 0, bloodGroup: 'Unknown', phone },
    { id: 'ci-other', name: 'Unverified synthetic contact', relation: 'Other', age: 30, score: 0, bloodGroup: 'Unknown', phone: '9876543211' },
  ] };
  const saved = await fetch(base + '/vault', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(vault) });
  assert.equal(saved.status, 200);
  const loaded = await (await fetch(base + '/vault', { headers })).json();
  assert.ok(!loaded.vault.reports.some(report => report.id === 'lab-ci-other-report'), 'Adding a contact number must not claim another patient report');
  const deniedFile = await fetch(base + '/files/000000000000000000000001', { headers });
  assert.equal(deniedFile.status, 404, 'An unrelated contact number must not authorize downloading a laboratory file');
  const deniedShare = await fetch(base + '/shares', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: 'lab-ci-other-report' }) });
  assert.equal(deniedShare.status, 404, 'An unrelated contact number must not authorize sharing a laboratory report');
  const bytes = fs.readFileSync(path.join(__dirname, '../tests/fixtures/synthetic-report.pdf'));
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'application/pdf' }), 'synthetic-report.pdf');
  const upload = await fetch(base + '/files', { method: 'POST', headers, body: form });
  assert.equal(upload.status, 200);
  const { fileId } = await upload.json();
  assert.ok(fileId);
  const original = await fetch(base + '/files/' + fileId, { headers });
  assert.equal(original.status, 200);
  assert.deepEqual(Buffer.from(await original.arrayBuffer()), bytes);
  const extraction = await fetch(base + '/analyze-report', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId, fileName: 'synthetic-report.pdf', title: 'Synthetic QA report' }), signal: AbortSignal.timeout(65000) });
  assert.equal(extraction.status, 200);
  const result = await extraction.json();
  assert.equal(result.parameters, 0);
  assert.match(result.summary, /API key is not configured/, 'PDF must render before reaching the deliberately unconfigured AI provider');
  vault.reports.push({ id: 'ci-upload', source: 'self_upload', memberId: 'ci-self', fileId, fileName: 'synthetic-report.pdf', markers: [], parameters: 0, title: 'Synthetic QA report' });
  assert.equal((await fetch(base + '/vault', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(vault) })).status, 200);
  const shared = await fetch(base + '/shares', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'x-forwarded-host': 'vault.example.test', 'x-forwarded-proto': 'https' }, body: JSON.stringify({ reportId: 'ci-upload', expiresInHours: 168 }) });
  assert.equal(shared.status, 201);
  const share = await shared.json();
  assert.equal(new URL(share.url).origin, 'https://vault.example.test', 'Shared link must use the public proxy URL');
  const publicPath = '/public/share/' + new URL(share.url).pathname.split('/').pop();
  assert.equal((await fetch(base + publicPath)).status, 200);
  assert.equal((await fetch(base + '/shares?shareId=' + share.share.id, { method: 'DELETE', headers })).status, 200);
  assert.equal((await fetch(base + publicPath)).status, 410);
  const patch = change => fetch(base + '/vault', { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(change) });
  const records = ['ci-concurrent-a', 'ci-concurrent-b'].map(id => ({ ...vault.reports[0], id }));
  for (const response of await Promise.all(records.map(report => patch({ action: 'save_report', report })))) assert.equal(response.status, 200);
  let concurrentVault = (await (await fetch(base + '/vault', { headers })).json()).vault;
  for (const report of records) assert.ok(concurrentVault.reports.some(item => item.id === report.id), 'Concurrent uploads must both survive');
  assert.equal((await patch({ action: 'select_member', memberId: 'ci-other' })).status, 200);
  assert.equal((await patch({ action: 'save_report', report: { ...records[0], starred: true } })).status, 200);
  assert.equal((await patch({ action: 'delete_report', reportId: records[1].id })).status, 200);
  concurrentVault = (await (await fetch(base + '/vault', { headers })).json()).vault;
  assert.equal(concurrentVault.activeMemberId, 'ci-other');
  assert.ok(concurrentVault.reports.find(report => report.id === records[0].id).starred);
  assert.ok(!concurrentVault.reports.some(report => report.id === records[1].id));
  assert.ok(concurrentVault.reports.some(report => report.id === 'ci-upload'));
  console.log('PASS: concurrent native uploads, selection, report update and deletion preserve unrelated records');
  console.log('PASS: patient report isolation; production image health, scoped 1111 login, PDF upload, exact original download and PDF rendering');
})().catch(error => { console.error(error.message); process.exit(1); });

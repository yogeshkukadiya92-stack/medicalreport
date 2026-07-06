# Phase 12: Lab Dashboard + Client App Sync

## Implemented

- Lab portal under `/lab`:
  - `/lab`: KPIs, recent reports, recent activity.
  - `/lab/clients`: client master by phone.
  - `/lab/create`: structured report builder with template, custom, and attachment modes.
  - `/lab/reports`: history, filters, detail modal, original file opening.
  - `/lab/templates`: CBC, Lipid, Thyroid, Diabetes, Vitamin, Liver, Kidney, Urine, Custom.
  - `/lab/settings`: lab profile name, phone, address.
- Lab-created reports do not use AI.
- Save publishes immediately.
- Duplicate warning appears for same lab + phone + report type + report date.
- Values get rule-based abnormal status from numeric reference ranges where possible.
- Original PDF/image attachments use MongoDB GridFS.
- Client app `/reports` shows source badges:
  - `Uploaded by you`
  - `Lab Report`
- Client app `/api/vault` merges published lab reports by normalized family-member phone.
- Unmatched lab reports remain in `clientReportLinks` as `unclaimed`.
- Matched reports are marked `claimed` when a matching client vault loads.

## MongoDB Collections

- `labs`
- `labUsers`
- `labClients`
- `labReports`
- `labReportValues`
- `labReportAuditLogs`
- `clientReportLinks`
- `vaults`
- GridFS bucket: `reportFiles`

## Important Behavior

- Supabase remains the auth provider.
- First lab portal visit by a signed-in user creates a default `MediVault Lab` and makes that user `lab_admin`.
- Lab report access is scoped by `labId`.
- Client access to lab report files is allowed only when a published lab report matches a family member phone.
- Client-side vault saves filter out lab reports so lab data stays authoritative in lab collections.

## Verify

```bash
cd medivault-web
npm run build
```

Manual flow:

1. Sign in.
2. Add a family member with phone number in `/family`.
3. Open `/lab/clients` and add a client with the same phone.
4. Open `/lab/create`, select CBC/Lipid/Thyroid template, enter values, optionally attach PDF/image.
5. Save and publish.
6. Reload `/reports` in the client app and confirm the lab report appears with `Lab Report` badge.

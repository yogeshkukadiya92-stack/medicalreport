# Phase 13: Lab Dashboard Upgrade

## Implemented

- Added dashboard API data from `/api/lab/reports`:
  - `workQueue`: today reports, missing attachment, abnormal today, unmatched, published today.
  - `criticalAlerts`: latest published lab report values marked `High` or `Low`.
  - `syncStatus`: claimed, unclaimed, published total, and claim percentage.
- Added `/lab` dashboard panels:
  - Today Work Queue.
  - Critical Alerts.
  - Client App Sync Status.
- Added report history URL filter support:
  - `sync=claimed`
  - `sync=unclaimed`
  - existing date/status filters from dashboard links.

## Behavior

- No AI is used for dashboard alerts.
- Alerts are based only on structured lab report values.
- Missing attachment means a lab report has no `fileId`.
- Visible in app means `clientReportLinks.state` is `claimed`.
- Waiting phone link means `clientReportLinks.state` is `unclaimed`.

## Verify

```bash
cd medivault-web
npm run build
```

Manual checks:

1. Open `/lab`.
2. Confirm Today Work Queue, Critical Alerts, and Client App Sync Status appear.
3. Create a lab report with `High` or `Low` values and confirm it appears in Critical Alerts.
4. Create a report without attachment and confirm Needs attachment count updates.
5. Open `/lab/reports?sync=unclaimed` and confirm waiting-phone reports are filtered.

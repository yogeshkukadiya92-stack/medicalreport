# MediVault Live Wiring Inventory

## Summary
This inventory groups repeated controls by screen/component. All listed items were checked for route/API/database/auth behavior during the demo-to-live pass.

| Area | File | Control | Live Behavior | Backend/API/Route | Auth/Role | Status |
|---|---|---|---|---|---|---|
| Client shell | `src/components/mobile-shell.tsx` | Bottom nav | Navigates to Dashboard, Reports, Upload, Analytics, Family | App routes | Supabase session in production | Done |
| Client auth | `src/app/login/page.tsx` | Sign in, create account, magic link | Uses Supabase email/password and OTP magic link, preserves `next` redirect | Supabase Auth | Public auth page | Done |
| Client auth | `src/components/sign-out-button.tsx` | Logout | Signs out Supabase session, clears API bearer token, redirects to login | Supabase Auth | Signed-in user | Done |
| Dashboard | `src/app/dashboard/page.tsx` | Notification button | Opens filtered reports needing review, or all reports when clear | `/reports?filter=Needs review` | Signed-in user | Done |
| Dashboard | `src/app/dashboard/page.tsx` | Member chips | Switches active member and recalculates score from live reports | Local vault state synced to `/api/vault` | Signed-in user | Done |
| Dashboard | `src/app/dashboard/page.tsx` | Upload, Reports, Analytics quick actions | Routes to real app pages; upload redirects to Family if no member exists | App routes | Signed-in user | Done |
| Dashboard | `src/app/dashboard/page.tsx` | Needs attention cards | Opens exact report detail by `reportId` | `/reports?reportId=...` | Signed-in user | Done |
| Dashboard | `src/app/dashboard/page.tsx` | Recent reports | Opens exact report detail by `reportId` | `/reports?reportId=...` | Signed-in user | Done |
| Reports | `src/app/reports/page.tsx` | Upload icon | Routes to upload flow | `/upload` | Signed-in user | Done |
| Reports | `src/app/reports/page.tsx` | Search, status filters, source filters | Filters live active-member reports and syncs URL params | Client vault data from `/api/vault` | Signed-in user | Done |
| Reports | `src/app/reports/page.tsx` | View report | Opens detail modal and writes `reportId` to URL | Client state | Signed-in user | Done |
| Reports | `src/app/reports/page.tsx` | Star, reviewed, edit, delete | Updates local vault and persists via cloud sync; lab reports are protected from client edits/deletes | `PUT /api/vault`, `DELETE /api/files/:fileId` when needed | Signed-in user | Done |
| Reports | `src/app/reports/page.tsx` | Manual entry modal | Validates member and values, saves structured report values to vault | `PUT /api/vault` through app provider | Signed-in user | Done |
| Reports | `src/app/reports/page.tsx` | View original file | Fetches authorized GridFS file and opens it with loading/error state | `GET /api/files/:fileId` | Owner, matching client, or lab user | Done |
| Upload | `src/app/upload/page.tsx` | File picker and save report | Stores original file, sends image/PDF page to AI, updates report values/status | `POST /api/files`, `POST /api/analyze-report`, `PUT /api/vault` | Signed-in user | Done |
| Upload | `src/app/upload/page.tsx` | Family member selector | Assigns upload to selected vault member | Client vault state | Signed-in user | Done |
| Upload | `src/app/upload/page.tsx` | View reports | Routes to reports page after/cancel flow | `/reports` | Signed-in user | Done |
| Family | `src/app/family/page.tsx` | Add/edit family member | Validates name, saves member and phone for lab matching | `PUT /api/vault` through app provider | Signed-in user | Done |
| Family | `src/app/family/page.tsx` | Use member | Sets active family member and persists | `PUT /api/vault` | Signed-in user | Done |
| Family | `src/app/family/page.tsx` | Delete member | Confirms destructive action, removes linked self-upload reports | `PUT /api/vault` | Signed-in user | Done |
| Analytics | `src/app/analytics/page.tsx` | Date range tabs | Filters metrics, score, chart bars, summary, and parameters by selected range | Client vault data from `/api/vault` | Signed-in user | Done |
| Analytics | `src/app/analytics/page.tsx` | Flagged toggle | Switches between all markers and flagged markers | Client vault data | Signed-in user | Done |
| Lab shell | `src/components/lab-shell.tsx` | Lab nav and client app link | Routes to live lab pages and client app | App routes | Supabase session | Done |
| Lab dashboard | `src/app/lab/page.tsx` | KPI cards | Open filtered lab report history | `/lab/reports` query params | Lab user | Done |
| Lab dashboard | `src/app/lab/page.tsx` | Today work queue actions | Open create/history/unmatched/missing attachment views | `/lab/create`, `/lab/reports` query params | Lab user | Done |
| Lab dashboard | `src/app/lab/page.tsx` | Critical alerts | Opens exact lab report detail | `/lab/reports?reportId=...` | Lab user, lab scoped | Done |
| Lab dashboard | `src/app/lab/page.tsx` | Client app sync cards | Opens claimed/unclaimed/published report filters | `/lab/reports?sync=...` | Lab user, lab scoped | Done |
| Lab clients | `src/app/lab/clients/page.tsx` | Save client | Creates or updates client by normalized phone | `POST /api/lab/clients` | Lab user | Done |
| Lab clients | `src/app/lab/clients/page.tsx` | Search | Searches lab-scoped clients by name/phone | `GET /api/lab/clients?q=...` | Lab user | Done |
| Lab clients | `src/app/lab/clients/page.tsx` | Report | Opens report builder prefilled by client ID | `/lab/create?clientId=...` | Lab user | Done |
| Lab clients | `src/app/lab/clients/page.tsx` | Edit | Prefills client form for update | `POST /api/lab/clients` | Lab user | Done |
| Lab create | `src/app/lab/create/page.tsx` | Mode tabs | Switches template/custom/attachment builder mode | Client state | Lab user | Done |
| Lab create | `src/app/lab/create/page.tsx` | Client/template URL prefill | Applies `clientId`, `phone`, and `template` query params | `GET /api/lab/clients`, `GET /api/lab/templates` | Lab user | Done |
| Lab create | `src/app/lab/create/page.tsx` | Add/remove values | Edits structured report values and calculates status from range | Client rule engine | Lab user | Done |
| Lab create | `src/app/lab/create/page.tsx` | Save and publish | Stores file if attached, creates client/report/values/audit logs, auto-publishes | `POST /api/files`, `POST /api/lab/records` | Lab user, lab scoped | Done |
| Lab reports | `src/app/lab/reports/page.tsx` | Search/filter/apply/clear | Fetches lab-scoped report history with query params | `GET /api/lab/records` | Lab user, lab scoped | Done |
| Lab reports | `src/app/lab/reports/page.tsx` | Report row | Opens detail modal and writes `reportId` to URL | `GET /api/lab/records?reportId=...` | Lab user, lab scoped | Done |
| Lab reports | `src/app/lab/reports/page.tsx` | Open original file | Fetches authorized GridFS file with loading/error state | `GET /api/files/:fileId` | Lab user for same lab | Done |
| Lab templates | `src/app/lab/templates/page.tsx` | Create from template, Use | Opens report builder with selected template | `/lab/create?template=...` | Lab user | Done |
| Lab settings | `src/app/lab/settings/page.tsx` | Save settings | Updates lab profile and existing report lab names | `PATCH /api/lab/settings` | `lab_admin` only | Done |
| API wrappers | `src/lib/api/*.ts` | Legacy API service functions | No longer return dummy data; call `/api/vault`, `/api/files`, `/api/consents`, or fail clearly when unsupported | Live app APIs | Supabase bearer token | Done |
| Consents API | `src/app/api/consents/route.ts` | GET/POST consents | Stores consent grant/revoke records in MongoDB | `consents` collection | Signed-in user | Done |

## Blocked By Environment
- Railway must use a real Supabase anon/publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`; a service-role key is intentionally rejected by the app.
- Real AI extraction for client self-upload requires `OPENAI_API_KEY` or the configured NVIDIA key.

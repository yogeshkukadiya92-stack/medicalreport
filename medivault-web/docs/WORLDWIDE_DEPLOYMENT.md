# Worldwide Deployment Baseline

The workspace `dataRegion` setting is a policy preference. It does not move data by itself. A deployment may claim regional residency only when the application, MongoDB, object storage, backups, logs, queues, and third-party processors are all hosted in the declared region.

## Required Regional Stacks

Create isolated production stacks for `india`, `us`, `eu`, and `asia-pacific` when those regions are offered. Each stack must use separate:

- application and worker deployments
- MongoDB databases and credentials
- encrypted object-storage buckets
- encryption keys
- queues and webhook dead-letter storage
- logs, traces, backups, and disaster-recovery copies

Do not replicate identifiable health data across regions without a documented legal basis and customer agreement.

## Required Environment

Set these values per regional deployment:

```text
APP_TIME_ZONE=Asia/Kolkata
NEXT_PUBLIC_DEFAULT_COUNTRY=IN
NEXT_PUBLIC_DEFAULT_CURRENCY=INR
NEXT_PUBLIC_DEFAULT_LOCALE=en-IN
NEXT_PUBLIC_DEFAULT_TIME_ZONE=Asia/Kolkata
NEXT_PUBLIC_MEASUREMENT_SYSTEM=metric
NEXT_PUBLIC_DATA_REGION=india
```

Test OTP must remain disabled in production:

```text
AUTH_TEST_OTP=
ALLOW_TEST_OTP=false
```

## Tenant Boundary

Every lab-owned query must include the authenticated `labId`. Integration API keys must remain scoped to one lab and an explicit event/endpoint allowlist. GridFS files must be checked against their owner before download. Add automated cross-tenant tests before onboarding a second independent organization.

## Launch Gate

- encryption at rest and in transit verified
- backup restore tested
- audit-log retention configured
- regional subprocessors documented
- deletion/export workflow tested
- breach-response contacts and runbook approved
- uptime, error, queue, and suspicious-access alerts enabled

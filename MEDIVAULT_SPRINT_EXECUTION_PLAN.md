# MediVault — Backend Sprint Execution Plan

> **Project:** Medical Report Storage App Backend
> **Stack:** Python 3.12 · FastAPI · PostgreSQL 16 · Redis · AWS S3 · JWT · Docker
> **Sprint Duration:** 1 week each (7 sprints = ~7 weeks)
> **Team Size:** 1–2 backend developers
> **Date:** June 2026

---

## Table of Contents

1. [Sprint 1: Project Setup & Foundation](#sprint-1-project-setup--foundation)
2. [Sprint 2: Auth Module](#sprint-2-auth-module)
3. [Sprint 3: User Profile & Family Members](#sprint-3-user-profile--family-members)
4. [Sprint 4: File Upload & Cloud Storage](#sprint-4-file-upload--cloud-storage)
5. [Sprint 5: Medical Report & Metadata Module](#sprint-5-medical-report--metadata-module)
6. [Sprint 6: Security, Audit Logs & Consent](#sprint-6-security-audit-logs--consent)
7. [Sprint 7: Testing & Deployment Preparation](#sprint-7-testing--deployment-preparation)
8. [FastAPI Folder Structure](#fastapi-folder-structure)
9. [Git Branch Strategy](#git-branch-strategy)
10. [Code Quality Rules](#code-quality-rules)
11. [Backend Environment Setup](#backend-environment-setup)
12. [Local Development Setup](#local-development-setup)
13. [Staging Deployment Checklist](#staging-deployment-checklist)
14. [Production Deployment Checklist](#production-deployment-checklist)
15. [Security Checklist](#security-checklist)
16. [API Testing Checklist (Postman)](#api-testing-checklist-postman)
17. [Final Handover Checklist](#final-handover-checklist)

---

## Sprint 1: Project Setup & Foundation

### Goal
Set up the complete project skeleton, database connection, Docker environment, CI pipeline, and base utilities so every future sprint starts clean.

### Tasks

| # | Task | Priority | Est. Hours |
|---|------|----------|------------|
| 1.1 | Initialize Python project with `pyproject.toml` or `requirements.txt` | P0 | 1 |
| 1.2 | Create FastAPI app entry point (`app/main.py`) with health check | P0 | 1 |
| 1.3 | Set up project folder structure (see Folder Structure section) | P0 | 2 |
| 1.4 | Configure environment variables with Pydantic Settings (`app/config.py`) | P0 | 2 |
| 1.5 | Set up PostgreSQL with asyncpg connection pool (`app/database.py`) | P0 | 3 |
| 1.6 | Set up Alembic for database migrations | P0 | 2 |
| 1.7 | Create base SQLAlchemy model with `id`, `created_at`, `updated_at`, `deleted_at` | P0 | 1 |
| 1.8 | Write first Alembic migration — create `users` table | P0 | 2 |
| 1.9 | Set up Redis connection for OTP/cache (`app/redis.py`) | P1 | 2 |
| 1.10 | Create Docker Compose with PostgreSQL 16, Redis 7, and app service | P0 | 3 |
| 1.11 | Create `Dockerfile` (multi-stage build) | P0 | 2 |
| 1.12 | Set up CORS middleware | P1 | 1 |
| 1.13 | Create base response schemas (`SuccessResponse`, `ErrorResponse`, `PaginatedResponse`) | P0 | 2 |
| 1.14 | Create custom exception handler (`AppError` class + FastAPI handler) | P0 | 2 |
| 1.15 | Create pagination utility (`app/utils/pagination.py`) | P1 | 2 |
| 1.16 | Set up logging with structlog (JSON format) | P1 | 2 |
| 1.17 | Create `.env.example` with all required variables | P0 | 1 |
| 1.18 | Set up pre-commit hooks (ruff, black, mypy) | P1 | 1 |
| 1.19 | Create `Makefile` with common commands | P1 | 1 |
| 1.20 | Set up pytest with async fixtures and test database | P0 | 3 |

### API Endpoints to Build

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (returns DB + Redis status) |
| GET | `/` | Root redirect to `/docs` |

### Database Tables Involved

| Table | Action |
|-------|--------|
| `users` | Create migration (schema only, no CRUD yet) |

### Acceptance Criteria

- [ ] `docker compose up` starts PostgreSQL, Redis, and FastAPI app without errors
- [ ] `GET /health` returns `{"status": "healthy", "database": "connected", "redis": "connected"}`
- [ ] `GET /docs` shows Swagger UI with health endpoint
- [ ] Alembic migration creates `users` table successfully
- [ ] `alembic upgrade head` and `alembic downgrade -1` work both directions
- [ ] `pytest` runs with at least one passing test (health check)
- [ ] `.env.example` documents every required variable
- [ ] Ruff linter passes with zero warnings
- [ ] App starts in under 3 seconds

### Testing Checklist

- [ ] Health endpoint returns 200 when DB and Redis are up
- [ ] Health endpoint returns 503 when DB is down
- [ ] Health endpoint returns 503 when Redis is down
- [ ] CORS headers present in responses for allowed origins
- [ ] CORS blocks requests from non-allowed origins
- [ ] Custom error handler returns correct JSON structure
- [ ] Pagination utility calculates offset, total_pages correctly
- [ ] Docker container builds and runs without errors

### Possible Risks

| Risk | Mitigation |
|------|------------|
| asyncpg version incompatibility with SQLAlchemy 2.x | Pin exact versions: `sqlalchemy==2.0.30`, `asyncpg==0.29.0` |
| Alembic async migration complexity | Use `run_async` wrapper in `env.py`; test up/down early |
| Docker build slow on first run | Use multi-stage build; cache pip layer separately |
| Redis connection fails silently | Health check must verify Redis ping; fail loud |

### Developer Notes

```
# Key decisions:
# 1. Use SQLAlchemy 2.0 async (not raw asyncpg) — ORM saves time on CRUD
# 2. Pydantic v2 for all schemas — FastAPI native support
# 3. structlog for logging — JSON output for future ELK/CloudWatch
# 4. All timestamps are UTC (TIMESTAMPTZ in PostgreSQL)
# 5. UUIDs for all PKs — use uuid7 for time-sortability if needed

# Dependencies to install:
pip install fastapi[standard] uvicorn sqlalchemy[asyncio] asyncpg
pip install alembic pydantic-settings redis python-jose[cryptography]
pip install bcrypt python-multipart httpx boto3 structlog
pip install pytest pytest-asyncio httpx  # testing
pip install ruff black mypy pre-commit  # code quality
```

---

## Sprint 2: Auth Module

### Goal
Implement complete OTP-based phone authentication, JWT token management, and Google OAuth login flow.

### Tasks

| # | Task | Priority | Est. Hours |
|---|------|----------|------------|
| 2.1 | Create OTP service (`app/services/otp_service.py`) — generate, store in Redis, verify | P0 | 3 |
| 2.2 | Create SMS gateway integration (Twilio/MSG91) — `app/services/sms_service.py` | P0 | 3 |
| 2.3 | Create JWT utility (`app/utils/security.py`) — encode, decode, token pair generation | P0 | 3 |
| 2.4 | Create `refresh_tokens` table migration | P0 | 1 |
| 2.5 | Create auth schemas (`app/schemas/auth.py`) — OTP request, verify, token response | P0 | 2 |
| 2.6 | Build `POST /v1/auth/otp/send` endpoint | P0 | 3 |
| 2.7 | Build `POST /v1/auth/otp/verify` endpoint — create user if new, return tokens | P0 | 4 |
| 2.8 | Build `POST /v1/auth/token/refresh` endpoint with token rotation | P0 | 3 |
| 2.9 | Build `POST /v1/auth/logout` endpoint — revoke refresh token | P0 | 2 |
| 2.10 | Create auth middleware/dependency (`app/dependencies.py`) — `get_current_user` | P0 | 3 |
| 2.11 | Build `POST /v1/auth/google` endpoint — verify Google ID token, create/login user | P1 | 4 |
| 2.12 | Implement OTP rate limiting — 60s cooldown, max 3 sends per 15 min | P0 | 2 |
| 2.13 | Implement OTP attempt limiting — max 5 wrong attempts per phone | P0 | 2 |
| 2.14 | Create dev-mode OTP bypass — fixed OTP "000000" for testing in development | P1 | 1 |
| 2.15 | Add phone number validation (E.164 format with country code) | P0 | 1 |

### API Endpoints to Build

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/auth/otp/send` | No | Send OTP to phone number |
| POST | `/v1/auth/otp/verify` | No | Verify OTP, return JWT tokens |
| POST | `/v1/auth/google` | No | Google OAuth login |
| POST | `/v1/auth/token/refresh` | No | Refresh access token |
| POST | `/v1/auth/logout` | Yes | Revoke refresh token |

### Database Tables Involved

| Table | Action |
|-------|--------|
| `users` | INSERT on first login, UPDATE `last_login_at` |
| `refresh_tokens` | Create table, INSERT/UPDATE on login/refresh |

### Redis Keys Involved

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `otp:{phone}` | 300s | Store 6-digit OTP |
| `otp_attempts:{phone}` | 900s | Track failed verify attempts |
| `otp_cooldown:{phone}` | 60s | Rate limit between sends |
| `otp_send_count:{phone}` | 900s | Track total sends (max 3) |

### Acceptance Criteria

- [ ] New phone number: OTP sent, verify creates user, returns access + refresh tokens
- [ ] Existing phone number: OTP sent, verify logs in, returns tokens
- [ ] Access token expires in 15 minutes
- [ ] Refresh token expires in 30 days
- [ ] Token refresh returns new access + refresh token pair, revokes old refresh
- [ ] OTP expires after 5 minutes
- [ ] 6th wrong OTP attempt returns 429 with `AUTH_OTP_MAX_ATTEMPTS`
- [ ] Requesting OTP within 60s returns 429 with `AUTH_OTP_COOLDOWN`
- [ ] 4th OTP send in 15 min returns 429
- [ ] Logout revokes refresh token — cannot use it again
- [ ] Protected endpoint returns 401 without token
- [ ] Protected endpoint returns 401 with expired token
- [ ] Google OAuth creates new user or logs in existing
- [ ] Dev mode: OTP "000000" always works (dev only, not production)

### Testing Checklist

- [ ] Send OTP — valid phone → 200, OTP stored in Redis
- [ ] Send OTP — invalid phone format → 400
- [ ] Send OTP — within cooldown → 429
- [ ] Send OTP — exceed send limit → 429
- [ ] Verify OTP — correct code → 200, tokens returned
- [ ] Verify OTP — wrong code → 400, attempts decremented
- [ ] Verify OTP — expired OTP → 400
- [ ] Verify OTP — max attempts exceeded → 429
- [ ] Verify OTP — new user → user created in DB
- [ ] Verify OTP — existing user → `last_login_at` updated
- [ ] Refresh token — valid → new token pair, old revoked
- [ ] Refresh token — expired → 401
- [ ] Refresh token — already revoked → 401
- [ ] Logout — valid refresh token → 200, token revoked
- [ ] Protected route — no header → 401
- [ ] Protected route — invalid token → 401
- [ ] Protected route — expired token → 401
- [ ] Protected route — valid token → request proceeds
- [ ] Google auth — valid ID token → 200
- [ ] Google auth — invalid ID token → 401

### Possible Risks

| Risk | Mitigation |
|------|------------|
| SMS provider downtime | Abstract SMS behind interface; swap providers without code change |
| OTP brute force | Rate limit + attempt limit + cooldown already in scope |
| JWT secret exposure | Load from env var only; never commit; rotate quarterly |
| Refresh token theft | Token rotation — each use invalidates old token |
| Google OAuth token verification latency | Cache Google public keys for 24h |

### Developer Notes

```
# JWT payload structure:
{
  "sub": "user-uuid",          # user ID
  "phone": "+919876543210",    # for display
  "role": "user",              # user | admin
  "iat": 1782000000,          # issued at
  "exp": 1782000900           # expires (15 min)
}

# OTP flow in Redis:
# 1. Check otp_cooldown:{phone} — if exists, reject (60s between sends)
# 2. Check otp_send_count:{phone} — if >= 3, reject (max 3 per 15 min)
# 3. Generate 6-digit OTP, store in otp:{phone} with 300s TTL
# 4. Set otp_cooldown:{phone} = 1 with 60s TTL
# 5. Increment otp_send_count:{phone} with 900s TTL

# SMS provider interface:
class SMSProvider(Protocol):
    async def send_otp(self, phone: str, otp: str) -> bool: ...

# Implement: TwilioSMS, MSG91SMS, ConsoleSMS (dev mode prints to stdout)
```

---

## Sprint 3: User Profile & Family Members

### Goal
Build complete user profile management and family member CRUD with the "self" member auto-creation pattern.

### Tasks

| # | Task | Priority | Est. Hours |
|---|------|----------|------------|
| 3.1 | Create `user_profiles` table migration | P0 | 1 |
| 3.2 | Create `family_members` table migration | P0 | 1 |
| 3.3 | Create profile SQLAlchemy model | P0 | 1 |
| 3.4 | Create family member SQLAlchemy model | P0 | 1 |
| 3.5 | Create profile Pydantic schemas (create, update, response) | P0 | 2 |
| 3.6 | Create family member Pydantic schemas | P0 | 2 |
| 3.7 | Build `POST /v1/profile` — create profile + auto-create "self" family member | P0 | 3 |
| 3.8 | Build `GET /v1/profile` — return current user's profile | P0 | 1 |
| 3.9 | Build `PATCH /v1/profile` — partial update | P0 | 2 |
| 3.10 | Build `GET /v1/family-members` — list with report count | P0 | 2 |
| 3.11 | Build `POST /v1/family-members` — add with 10-member limit | P0 | 3 |
| 3.12 | Build `PATCH /v1/family-members/{id}` — partial update | P0 | 2 |
| 3.13 | Build `DELETE /v1/family-members/{id}` — soft delete, block "self" deletion | P0 | 2 |
| 3.14 | Build `PATCH /v1/family-members/{id}/set-default` — switch active profile | P0 | 2 |
| 3.15 | Add profile avatar upload support (presigned URL for S3) | P2 | 3 |
| 3.16 | Add ownership validation middleware — users can only access own data | P0 | 2 |
| 3.17 | Update OTP verify response to include `has_profile` flag | P0 | 1 |

### API Endpoints to Build

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/profile` | Yes | Create user profile |
| GET | `/v1/profile` | Yes | Get own profile |
| PATCH | `/v1/profile` | Yes | Update profile (partial) |
| GET | `/v1/family-members` | Yes | List family members |
| POST | `/v1/family-members` | Yes | Add family member |
| PATCH | `/v1/family-members/{id}` | Yes | Update family member |
| DELETE | `/v1/family-members/{id}` | Yes | Soft delete member |
| PATCH | `/v1/family-members/{id}/set-default` | Yes | Set active member |

### Database Tables Involved

| Table | Action |
|-------|--------|
| `user_profiles` | Create table, full CRUD |
| `family_members` | Create table, full CRUD |
| `users` | Read (ownership check) |

### Acceptance Criteria

- [ ] Create profile → also creates `family_members` row with `relation='self'` and `is_default=true`
- [ ] Create profile twice → 409 `PROFILE_ALREADY_EXISTS`
- [ ] Get profile → returns profile for current authenticated user
- [ ] Update profile → partial update, only provided fields change
- [ ] List family members → includes `report_count` for each member
- [ ] Add family member → 11th member returns 422 `FAMILY_MEMBER_LIMIT`
- [ ] Delete "self" member → 422 error with clear message
- [ ] Delete non-self member → soft delete (sets `deleted_at`)
- [ ] Deleted members do not appear in list
- [ ] Set default → only one member has `is_default=true` at any time
- [ ] User A cannot access User B's profile or family members
- [ ] All validation rules enforced: gender enum, blood group enum, relation enum

### Testing Checklist

- [ ] Create profile — valid data → 201, profile + self member created
- [ ] Create profile — missing `full_name` → 400
- [ ] Create profile — invalid `gender` → 400
- [ ] Create profile — invalid `blood_group` → 400
- [ ] Create profile — duplicate → 409
- [ ] Get profile — exists → 200
- [ ] Get profile — not created yet → 404
- [ ] Update profile — partial fields → 200, only those fields changed
- [ ] List family members — returns array with self member
- [ ] Add member — valid → 201
- [ ] Add member — invalid relation → 400
- [ ] Add member — 11th member → 422
- [ ] Update member — valid → 200
- [ ] Update member — wrong user's member → 404
- [ ] Delete member — non-self → 204
- [ ] Delete member — self → 422
- [ ] Delete member — already deleted → 404
- [ ] Set default — valid → 200, previous default cleared
- [ ] Set default — wrong user's member → 404

### Possible Risks

| Risk | Mitigation |
|------|------------|
| Race condition on "self" member creation | Wrap profile + family member creation in DB transaction |
| Race condition on set-default (two concurrent requests) | Use `SELECT FOR UPDATE` on family_members rows |
| `report_count` query performance | Use subquery count, add index; consider caching later |

### Developer Notes

```
# Auto-create "self" member pattern:
async def create_profile(user_id, data):
    async with db.begin():
        profile = UserProfile(user_id=user_id, **data.dict())
        db.add(profile)
        
        self_member = FamilyMember(
            user_id=user_id,
            full_name=data.full_name,
            relation="self",
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            blood_group=data.blood_group,
            known_conditions=data.known_conditions,
            is_default=True
        )
        db.add(self_member)
    return profile

# Ownership check dependency:
async def verify_family_member_ownership(
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> FamilyMember:
    member = await db.get(FamilyMember, member_id)
    if not member or member.user_id != current_user.id or member.deleted_at:
        raise AppError("FAMILY_MEMBER_NOT_FOUND", "Family member not found", 404)
    return member
```

---

## Sprint 4: File Upload & Cloud Storage

### Goal
Implement secure file upload via presigned URLs, file metadata tracking, and signed download URL generation. No public file URLs.

### Tasks

| # | Task | Priority | Est. Hours |
|---|------|----------|------------|
| 4.1 | Create `uploaded_files` table migration | P0 | 1 |
| 4.2 | Create uploaded file SQLAlchemy model | P0 | 1 |
| 4.3 | Create file Pydantic schemas | P0 | 2 |
| 4.4 | Create storage service interface (`app/services/storage_service.py`) | P0 | 2 |
| 4.5 | Implement AWS S3 storage provider — presigned upload URL generation | P0 | 4 |
| 4.6 | Implement AWS S3 storage provider — presigned download URL generation | P0 | 3 |
| 4.7 | Implement GCS storage provider (same interface) | P2 | 4 |
| 4.8 | Build `POST /v1/files/upload-url` — validate, create file record, return presigned URL | P0 | 4 |
| 4.9 | Build `POST /v1/files/{id}/confirm` — verify file exists in S3, update status | P0 | 4 |
| 4.10 | Build `GET /v1/files/{id}/url` — generate signed download URL (15-min expiry) | P0 | 3 |
| 4.11 | Implement file type validation (PDF, JPEG, PNG, WebP only) | P0 | 1 |
| 4.12 | Implement file size validation (max 20 MB) | P0 | 1 |
| 4.13 | Generate S3 object key using pattern: `{user_id}/{year}/{month}/{file_uuid}.{ext}` | P0 | 1 |
| 4.14 | Implement SHA-256 checksum verification on confirm | P1 | 2 |
| 4.15 | Create local file storage provider for development (MinIO or filesystem) | P1 | 3 |
| 4.16 | Add S3 bucket CORS configuration documentation | P1 | 1 |
| 4.17 | Set up S3 bucket lifecycle policy — move to Glacier after 1 year | P2 | 1 |

### API Endpoints to Build

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/files/upload-url` | Yes | Get presigned upload URL |
| POST | `/v1/files/{id}/confirm` | Yes | Confirm upload completed |
| GET | `/v1/files/{id}/url` | Yes | Get signed download URL |

### Database Tables Involved

| Table | Action |
|-------|--------|
| `uploaded_files` | Create table, INSERT, UPDATE status |

### Acceptance Criteria

- [ ] Request upload URL → returns presigned S3 PUT URL valid for 10 minutes
- [ ] Client uploads file directly to S3 using presigned URL (server never touches file bytes)
- [ ] Confirm upload → server verifies file exists in S3, updates `upload_status = 'completed'`
- [ ] Get file URL → returns signed download URL valid for 15 minutes
- [ ] Signed download URL expires after 15 minutes — returns 403 from S3
- [ ] No public S3 bucket policy — all access via signed URLs
- [ ] File type validation rejects `.exe`, `.zip`, etc.
- [ ] File size > 20 MB rejected at presign request time
- [ ] S3 object key follows `{user_id}/{year}/{month}/{uuid}.{ext}` pattern
- [ ] User A cannot get download URL for User B's file
- [ ] Local dev: MinIO or filesystem works as S3 replacement

### Testing Checklist

- [ ] Upload URL — valid PDF request → 200, presigned URL returned
- [ ] Upload URL — valid JPEG request → 200
- [ ] Upload URL — .exe file → 415
- [ ] Upload URL — 25 MB file → 413
- [ ] Upload URL — 0 byte file → 400
- [ ] Confirm — file exists in S3 → 200, status = completed
- [ ] Confirm — file not in S3 → 400
- [ ] Confirm — checksum mismatch → 400
- [ ] Confirm — already confirmed → 409
- [ ] Get URL — valid file → 200, signed URL returned
- [ ] Get URL — file belongs to other user → 404
- [ ] Get URL — non-existent file → 404
- [ ] Signed URL — access after 15 min → S3 returns 403
- [ ] Storage provider switch — S3 ↔ local works via config

### Possible Risks

| Risk | Mitigation |
|------|------------|
| S3 presigned URL CORS issues | Document required S3 CORS config; test from browser |
| File uploaded but confirm never called (orphan) | Cron job to clean orphan files (status=pending, age > 24h) |
| Large file upload timeout | Client uploads directly to S3; server only handles metadata |
| S3 credentials rotation | Use IAM roles in production, not long-lived keys |
| Checksum computation on client side | Provide JS utility function in frontend docs |

### Developer Notes

```
# Storage service interface:
class StorageProvider(Protocol):
    async def generate_upload_url(
        self, object_key: str, mime_type: str, expires_in: int = 600
    ) -> dict: ...
    
    async def generate_download_url(
        self, object_key: str, expires_in: int = 900
    ) -> str: ...
    
    async def file_exists(self, object_key: str) -> bool: ...
    
    async def get_file_size(self, object_key: str) -> int: ...
    
    async def delete_file(self, object_key: str) -> bool: ...

# S3 bucket CORS config (must be applied manually):
{
    "CORSRules": [{
        "AllowedOrigins": ["https://medivault.app", "http://localhost:3000"],
        "AllowedMethods": ["PUT", "GET"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3600
    }]
}

# S3 bucket policy — BLOCK all public access:
# Enable "Block all public access" in S3 console
# Do NOT add any public bucket policy

# MinIO for local dev (docker-compose addition):
# minio:
#   image: minio/minio
#   ports: ["9000:9000", "9001:9001"]
#   environment:
#     MINIO_ROOT_USER: minioadmin
#     MINIO_ROOT_PASSWORD: minioadmin
#   command: server /data --console-address ":9001"
```

---

## Sprint 5: Medical Report & Metadata Module

### Goal
Build the core medical report lifecycle — create reports, link files, store extracted values, enable editing/confirmation, and provide trend analytics.

### Tasks

| # | Task | Priority | Est. Hours |
|---|------|----------|------------|
| 5.1 | Create `medical_reports` table migration | P0 | 1 |
| 5.2 | Create `report_metadata` table migration | P0 | 1 |
| 5.3 | Create `extracted_values` table migration | P0 | 1 |
| 5.4 | Create `parameter_definitions` table migration + seed data (20 params) | P0 | 2 |
| 5.5 | Create SQLAlchemy models for all 4 tables | P0 | 2 |
| 5.6 | Create Pydantic schemas — report create, update, list, detail, filters | P0 | 3 |
| 5.7 | Create Pydantic schemas — extracted values, trends, health summary | P0 | 2 |
| 5.8 | Build `POST /v1/reports` — create report, link files, trigger extraction | P0 | 4 |
| 5.9 | Build `GET /v1/reports` — list with pagination, search, filters, sorting | P0 | 5 |
| 5.10 | Build `GET /v1/reports/{id}` — full detail with files, metadata, extracted values | P0 | 3 |
| 5.11 | Build `PATCH /v1/reports/{id}` — update report metadata | P0 | 2 |
| 5.12 | Build `DELETE /v1/reports/{id}` — soft delete report + files | P0 | 2 |
| 5.13 | Build `PATCH /v1/reports/{id}/values/{vid}` — edit extracted value | P0 | 3 |
| 5.14 | Build `POST /v1/reports/{id}/confirm` — mark review complete | P0 | 2 |
| 5.15 | Build `POST /v1/reports/{id}/extract` — trigger AI extraction (stub) | P1 | 2 |
| 5.16 | Build `GET /v1/reports/{id}/status` — processing status polling | P0 | 2 |
| 5.17 | Build `POST /v1/reports/{id}/reprocess` — re-run extraction | P1 | 2 |
| 5.18 | Build `GET /v1/reports/trends/{param}` — parameter trend data | P0 | 4 |
| 5.19 | Build `GET /v1/reports/health-summary` — dashboard summary | P0 | 4 |
| 5.20 | Implement value status auto-calculation (normal/borderline/high/low) | P0 | 3 |
| 5.21 | Create report share link support (`report_share_links` table) | P0 | 1 |
| 5.22 | Build `POST /v1/share-links` — create share link with expiry/password | P0 | 4 |
| 5.23 | Build `GET /v1/share-links` — list user's share links | P0 | 2 |
| 5.24 | Build `DELETE /v1/share-links/{id}` — revoke link | P0 | 1 |
| 5.25 | Build `GET /v1/shared/{token}` — public view with password check | P0 | 4 |

### API Endpoints to Build

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/reports` | Yes | Create report |
| GET | `/v1/reports` | Yes | List with filters/search/pagination |
| GET | `/v1/reports/{id}` | Yes | Full report detail |
| PATCH | `/v1/reports/{id}` | Yes | Update metadata |
| DELETE | `/v1/reports/{id}` | Yes | Soft delete |
| PATCH | `/v1/reports/{id}/values/{vid}` | Yes | Edit extracted value |
| POST | `/v1/reports/{id}/confirm` | Yes | Confirm review |
| POST | `/v1/reports/{id}/extract` | Yes | Trigger extraction |
| GET | `/v1/reports/{id}/status` | Yes | Processing status |
| POST | `/v1/reports/{id}/reprocess` | Yes | Re-run extraction |
| GET | `/v1/reports/trends/{param}` | Yes | Trend data |
| GET | `/v1/reports/health-summary` | Yes | Dashboard summary |
| POST | `/v1/share-links` | Yes | Create share link |
| GET | `/v1/share-links` | Yes | List share links |
| DELETE | `/v1/share-links/{id}` | Yes | Revoke link |
| GET | `/v1/shared/{token}` | No | View shared reports |

### Database Tables Involved

| Table | Action |
|-------|--------|
| `medical_reports` | Create, full CRUD |
| `report_metadata` | Create, INSERT/UPDATE |
| `extracted_values` | Create, INSERT/UPDATE |
| `parameter_definitions` | Create, seed 20 rows |
| `report_share_links` | Create, full CRUD |
| `uploaded_files` | UPDATE `report_id` link |

### Acceptance Criteria

- [ ] Create report → links files, sets `processing_status = 'uploaded'`
- [ ] List reports → supports pagination (page/per_page), search (title/lab/doctor), filter (type/date/status/member), sort (date/title/created)
- [ ] Report detail → includes files with signed URLs, metadata, all extracted values
- [ ] Edit value → stores `original_ai_value`, sets `is_user_edited = true`, recalculates status
- [ ] Confirm → sets `processing_status = 'completed'`, all values `is_user_verified = true`
- [ ] Trends → returns date-ordered data points for a parameter across reports
- [ ] Health summary → returns attention items (out-of-range values) and recent reports
- [ ] Share link → creates token with expiry (24h/7d/30d), optional password (bcrypt hashed)
- [ ] Public view → returns report data with signed file URLs; blocks expired/revoked links
- [ ] Password-protected link → returns 403 without password, 403 with wrong password
- [ ] Soft delete → report, linked values, and files all have `deleted_at` set

### Testing Checklist

- [ ] Create report — valid → 201, files linked
- [ ] Create report — invalid family member → 404
- [ ] Create report — file belongs to other user → 403
- [ ] List reports — no filters → returns all user's reports, paginated
- [ ] List reports — filter by type → only matching reports
- [ ] List reports — search "Apollo" → matches lab_name
- [ ] List reports — filter by date range → correct results
- [ ] List reports — sort by report_date DESC → correct order
- [ ] List reports — page 2 → offset correct, `has_prev = true`
- [ ] Report detail — valid → 200, includes everything
- [ ] Report detail — other user's report → 404
- [ ] Report detail — deleted report → 404
- [ ] Update report — partial fields → 200
- [ ] Delete report — 204, subsequent GET → 404
- [ ] Edit value — new value stored, original preserved
- [ ] Edit value — status recalculated (e.g., 142 mg/dL FBS → "high")
- [ ] Confirm — status → completed, all values verified
- [ ] Trends — returns sorted data points
- [ ] Trends — no data → empty array
- [ ] Health summary — returns out-of-range items
- [ ] Share link — 24h expiry → correct `expires_at`
- [ ] Share link — with password → `is_password_protected = true`
- [ ] View shared — valid token → 200
- [ ] View shared — expired → 410
- [ ] View shared — revoked → 410
- [ ] View shared — password required, no password → 403
- [ ] View shared — wrong password → 403
- [ ] View shared — correct password → 200
- [ ] Revoke link → 200, subsequent view → 410

### Possible Risks

| Risk | Mitigation |
|------|------------|
| Complex list query performance | Add composite indexes; test with 1000+ reports |
| Trend query slow with many reports | Index on `(report_id, parameter_name)`; limit to last N months |
| AI extraction not ready yet | Stub the extraction endpoint; return mock processing status |
| Share token brute force | Use 64-char crypto-random token; rate limit public endpoint |
| Orphan extracted values after report delete | CASCADE delete in DB; or soft delete in application |

### Developer Notes

```
# Value status auto-calculation:
def calculate_status(value: float, ref_low: float, ref_high: float) -> str:
    if value < ref_low:
        margin = (ref_low - value) / ref_low
        return "critical" if margin > 0.2 else "low"
    elif value > ref_high:
        margin = (value - ref_high) / ref_high
        return "critical" if margin > 0.3 else "high"
    else:
        margin_low = (value - ref_low) / (ref_high - ref_low)
        margin_high = (ref_high - value) / (ref_high - ref_low)
        if margin_low < 0.1 or margin_high < 0.1:
            return "borderline"
        return "normal"

# AI extraction stub — will be replaced in AI module sprint:
async def trigger_extraction(report_id: UUID):
    report.processing_status = "processing"
    # In production: enqueue to Celery/SQS
    # For now: update status to review_pending after 5s delay
    
# Share token generation:
import secrets
token = secrets.token_urlsafe(48)  # 64 chars

# Public share endpoint does NOT require auth but DOES:
# 1. Check expiry
# 2. Check revocation
# 3. Verify password if protected
# 4. Increment view_count
# 5. Return signed file URLs (15-min expiry)
# 6. Rate limit by IP (30/hour)
```

---

## Sprint 6: Security, Audit Logs & Consent

### Goal
Add consent management, immutable audit logging, rate limiting middleware, and security hardening across all modules.

### Tasks

| # | Task | Priority | Est. Hours |
|---|------|----------|------------|
| 6.1 | Create `consent_logs` table migration | P0 | 1 |
| 6.2 | Create `audit_logs` table migration with no-update/no-delete rules | P0 | 2 |
| 6.3 | Create consent SQLAlchemy model and schemas | P0 | 1 |
| 6.4 | Create audit log SQLAlchemy model | P0 | 1 |
| 6.5 | Build `POST /v1/consents` — grant consent | P0 | 2 |
| 6.6 | Build `GET /v1/consents` — get current consent status | P0 | 2 |
| 6.7 | Build `POST /v1/consents/revoke` — revoke consent | P0 | 2 |
| 6.8 | Create audit log service (`app/services/audit_service.py`) | P0 | 3 |
| 6.9 | Add audit logging to auth endpoints (login, logout, register) | P0 | 2 |
| 6.10 | Add audit logging to profile and family member mutations | P0 | 2 |
| 6.11 | Add audit logging to file upload/download/delete | P0 | 2 |
| 6.12 | Add audit logging to report CRUD and value edits | P0 | 2 |
| 6.13 | Add audit logging to share link create/view/revoke | P0 | 2 |
| 6.14 | Add audit logging to consent grant/revoke | P0 | 1 |
| 6.15 | Create rate limiting middleware using Redis (`app/middleware/rate_limit.py`) | P0 | 4 |
| 6.16 | Apply rate limits: auth endpoints (3/15min), file upload (20/hr), general (100/min) | P0 | 2 |
| 6.17 | Add consent check dependency — block AI extraction if consent not granted | P0 | 2 |
| 6.18 | Add request ID middleware — unique ID per request for tracing | P1 | 1 |
| 6.19 | Add input sanitization middleware — strip XSS from text fields | P1 | 2 |
| 6.20 | Add security headers middleware (X-Content-Type-Options, X-Frame-Options, etc.) | P1 | 1 |
| 6.21 | Verify soft delete — all queries exclude `deleted_at IS NOT NULL` | P0 | 2 |
| 6.22 | Add SQL injection protection audit — verify no raw string concatenation | P0 | 2 |
| 6.23 | Add API key authentication for future service-to-service calls | P2 | 3 |

### API Endpoints to Build

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/consents` | Yes | Grant consent |
| GET | `/v1/consents` | Yes | Get consent status |
| POST | `/v1/consents/revoke` | Yes | Revoke consent |

### Database Tables Involved

| Table | Action |
|-------|--------|
| `consent_logs` | Create, INSERT, READ |
| `audit_logs` | Create, INSERT only (append-only) |

### Acceptance Criteria

- [ ] Grant AI consent → creates log with type, version, IP, user agent
- [ ] Revoke consent → sets `revoked_at`, new AI extractions blocked
- [ ] Get consents → returns current status for each type
- [ ] Audit log records every mutation with user, action, resource, details, IP
- [ ] Audit log table rejects UPDATE and DELETE operations (PostgreSQL rules)
- [ ] Rate limit: 4th OTP send in 15 min → 429
- [ ] Rate limit: 101st general request in 1 min → 429
- [ ] Rate limit: 21st file upload in 1 hour → 429
- [ ] Rate limit response includes `Retry-After` header
- [ ] All responses include security headers
- [ ] All queries filter by `deleted_at IS NULL`
- [ ] No SQL string concatenation anywhere in codebase

### Testing Checklist

- [ ] Grant consent — valid → 201, stored with IP/user agent
- [ ] Grant consent — duplicate type → updates (idempotent)
- [ ] Revoke consent — exists → 200, `revoked_at` set
- [ ] Revoke consent — not granted → 404
- [ ] Get consents — returns all types with status
- [ ] Audit log — user login → entry created
- [ ] Audit log — report update → entry with before/after in details
- [ ] Audit log — direct SQL UPDATE on audit_logs → rejected
- [ ] Audit log — direct SQL DELETE on audit_logs → rejected
- [ ] Rate limit — under limit → request succeeds
- [ ] Rate limit — at limit → 429 with Retry-After
- [ ] Rate limit — after cooldown → request succeeds again
- [ ] Security headers — present in all responses
- [ ] Soft delete — deleted family member not in list
- [ ] Soft delete — deleted report not in list
- [ ] Consent check — no AI consent → extraction returns 403

### Possible Risks

| Risk | Mitigation |
|------|------------|
| Audit log table grows large | Partition by month; archive to cold storage after 1 year |
| Rate limiting Redis dependency | If Redis down, fall back to permissive (allow all) with alert |
| Audit log write latency impacts API response | Write audit logs async (fire-and-forget, background task) |
| Consent versioning complexity | Simple approach: latest consent per type wins |

### Developer Notes

```
# Audit service — fire-and-forget pattern:
from fastapi import BackgroundTasks

@router.patch("/reports/{report_id}")
async def update_report(
    report_id: UUID,
    data: ReportUpdate,
    bg: BackgroundTasks,
    user: User = Depends(get_current_user),
    request: Request
):
    old_data = ...  # snapshot before
    report = await update_report_in_db(report_id, data)
    bg.add_task(
        log_audit,
        user_id=user.id,
        action="report.update",
        resource_type="report",
        resource_id=report_id,
        details={"before": old_data, "after": data.dict(exclude_unset=True)},
        request=request
    )
    return report

# Rate limiter — Redis sliding window:
class RateLimiter:
    def __init__(self, redis, key_prefix: str, max_requests: int, window_seconds: int):
        ...
    
    async def check(self, identifier: str) -> tuple[bool, int]:
        """Returns (allowed, retry_after_seconds)"""
        key = f"rate:{self.key_prefix}:{identifier}"
        pipe = self.redis.pipeline()
        now = time.time()
        pipe.zremrangebyscore(key, 0, now - self.window_seconds)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, self.window_seconds)
        _, _, count, _ = await pipe.execute()
        if count > self.max_requests:
            return False, self.window_seconds
        return True, 0

# Security headers middleware:
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

---

## Sprint 7: Testing & Deployment Preparation

### Goal
Achieve 80%+ test coverage, set up CI/CD pipeline, prepare staging and production environments, and complete documentation.

### Tasks

| # | Task | Priority | Est. Hours |
|---|------|----------|------------|
| 7.1 | Write unit tests for all services (OTP, JWT, storage, audit) | P0 | 6 |
| 7.2 | Write integration tests for auth flow (send OTP → verify → refresh → logout) | P0 | 4 |
| 7.3 | Write integration tests for profile + family member CRUD | P0 | 3 |
| 7.4 | Write integration tests for file upload flow | P0 | 3 |
| 7.5 | Write integration tests for report CRUD + value editing | P0 | 4 |
| 7.6 | Write integration tests for share link flow | P0 | 3 |
| 7.7 | Write integration tests for consent + audit logs | P0 | 2 |
| 7.8 | Write edge case tests — rate limiting, expired tokens, soft delete, ownership | P0 | 4 |
| 7.9 | Set up test database with fixtures and factories (factory_boy) | P0 | 3 |
| 7.10 | Set up GitHub Actions CI pipeline — lint + test on every PR | P0 | 3 |
| 7.11 | Add test coverage reporting (pytest-cov, minimum 80%) | P0 | 1 |
| 7.12 | Set up staging environment on AWS/GCP | P0 | 4 |
| 7.13 | Create staging Docker Compose with managed PostgreSQL + Redis | P0 | 2 |
| 7.14 | Set up production environment with auto-scaling | P1 | 4 |
| 7.15 | Configure production PostgreSQL (RDS/Cloud SQL) with backups | P0 | 2 |
| 7.16 | Configure production Redis (ElastiCache/Memorystore) | P0 | 2 |
| 7.17 | Set up production S3 bucket with lifecycle policies | P0 | 2 |
| 7.18 | Create API documentation — export OpenAPI spec, verify all endpoints documented | P0 | 2 |
| 7.19 | Create Postman collection with all endpoints and examples | P0 | 3 |
| 7.20 | Create developer onboarding README | P0 | 2 |
| 7.21 | Run security audit — OWASP Top 10 checklist | P0 | 3 |
| 7.22 | Load testing — verify API handles 100 concurrent users | P1 | 3 |
| 7.23 | Create database backup and restore procedure | P0 | 2 |
| 7.24 | Create incident response runbook | P1 | 2 |

### API Endpoints to Build

No new endpoints. This sprint is testing, hardening, and deployment only.

### Database Tables Involved

All tables — testing and verification across the full schema.

### Acceptance Criteria

- [ ] Test coverage ≥ 80% (measured by pytest-cov)
- [ ] All 30 API endpoints have at least 1 happy path + 1 error path test
- [ ] CI pipeline: every PR runs lint (ruff) + type check (mypy) + tests (pytest)
- [ ] CI pipeline: fails if coverage drops below 80%
- [ ] Staging environment fully operational — all endpoints working
- [ ] Production environment provisioned with managed DB, Redis, S3
- [ ] Database backups configured — daily automated, 30-day retention
- [ ] Postman collection covers all endpoints with examples
- [ ] OpenAPI spec (`/openapi.json`) matches actual endpoints
- [ ] README covers: setup, run, test, deploy, architecture
- [ ] Load test: 100 concurrent users, p95 response time < 500ms
- [ ] OWASP Top 10 audit passed — no critical/high findings

### Testing Checklist

- [ ] Unit: OTP generate/verify logic
- [ ] Unit: JWT encode/decode/expiry
- [ ] Unit: File type/size validation
- [ ] Unit: Value status calculation
- [ ] Unit: Pagination utility
- [ ] Unit: Phone number validation
- [ ] Integration: Full auth flow (send → verify → access → refresh → logout)
- [ ] Integration: Profile create → family member list → update → delete
- [ ] Integration: File upload URL → confirm → download URL
- [ ] Integration: Report create → list → detail → update → delete
- [ ] Integration: Value edit → confirm → trends
- [ ] Integration: Share link create → public view → revoke
- [ ] Integration: Consent grant → revoke → extraction blocked
- [ ] Edge: Expired access token → 401
- [ ] Edge: Refresh with revoked token → 401
- [ ] Edge: Access other user's report → 404
- [ ] Edge: 11th family member → 422
- [ ] Edge: Delete self member → 422
- [ ] Edge: 25 MB file upload → 413
- [ ] Edge: Expired share link → 410
- [ ] Edge: Rate limit exceeded → 429
- [ ] Edge: Soft-deleted report in list → not visible
- [ ] Edge: SQL injection attempt in search → parameterized, safe
- [ ] Load: 100 concurrent report list requests → all succeed, p95 < 500ms

### Possible Risks

| Risk | Mitigation |
|------|------------|
| Test database cleanup between tests | Use transactions — rollback after each test |
| CI pipeline slow (> 10 min) | Parallelize test groups; use PostgreSQL in Docker for CI |
| Staging/production cost | Start with smallest instances; scale later |
| Load test reveals bottleneck | Profile SQL queries with EXPLAIN ANALYZE; add indexes |
| Test flakiness with Redis | Use fakeredis for unit tests; real Redis for integration |

### Developer Notes

```
# Test fixtures with factory_boy:
class UserFactory(factory.Factory):
    class Meta:
        model = User
    id = factory.LazyFunction(uuid4)
    phone = factory.Sequence(lambda n: f"+9198765{n:05d}")
    phone_verified = True
    is_active = True
    role = "user"

class ReportFactory(factory.Factory):
    class Meta:
        model = MedicalReport
    id = factory.LazyFunction(uuid4)
    user_id = factory.LazyFunction(uuid4)
    source = "pdf"
    processing_status = "completed"

# Test client setup:
@pytest.fixture
async def client(test_db):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def auth_client(client, test_user):
    token = create_access_token({"sub": str(test_user.id)})
    client.headers["Authorization"] = f"Bearer {token}"
    yield client

# CI pipeline (.github/workflows/ci.yml):
# on: [pull_request]
# jobs:
#   test:
#     services:
#       postgres: {image: postgres:16, env: ...}
#       redis: {image: redis:7}
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-python@v5
#       - run: pip install -r requirements.txt
#       - run: ruff check .
#       - run: mypy app/
#       - run: pytest --cov=app --cov-fail-under=80
```

---

## FastAPI Folder Structure

```
medivault-api/
│
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI app instance, startup/shutdown, middleware
│   ├── config.py                        # Pydantic Settings — all env vars
│   ├── database.py                      # async engine, session factory, get_db dependency
│   ├── redis.py                         # Redis connection pool
│   ├── dependencies.py                  # get_current_user, get_db, ownership checks
│   │
│   ├── models/                          # SQLAlchemy ORM models
│   │   ├── __init__.py                  # Export all models
│   │   ├── base.py                      # Base model (id, created_at, updated_at, deleted_at)
│   │   ├── user.py                      # User
│   │   ├── profile.py                   # UserProfile
│   │   ├── family_member.py             # FamilyMember
│   │   ├── uploaded_file.py             # UploadedFile
│   │   ├── report.py                    # MedicalReport
│   │   ├── report_metadata.py           # ReportMetadata
│   │   ├── extracted_value.py           # ExtractedValue
│   │   ├── parameter_definition.py      # ParameterDefinition
│   │   ├── share_link.py               # ReportShareLink
│   │   ├── consent.py                  # ConsentLog
│   │   ├── audit.py                    # AuditLog
│   │   └── refresh_token.py            # RefreshToken
│   │
│   ├── schemas/                         # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── base.py                      # SuccessResponse, ErrorResponse, PaginatedResponse
│   │   ├── auth.py                      # OTPSend, OTPVerify, TokenResponse, GoogleAuth
│   │   ├── profile.py                   # ProfileCreate, ProfileUpdate, ProfileResponse
│   │   ├── family_member.py             # MemberCreate, MemberUpdate, MemberResponse
│   │   ├── file.py                      # UploadURLRequest, UploadConfirm, FileURLResponse
│   │   ├── report.py                    # ReportCreate, ReportUpdate, ReportDetail, ReportList
│   │   ├── extracted_value.py           # ValueUpdate, ValueResponse, TrendData
│   │   ├── share.py                     # ShareCreate, ShareResponse, SharedView
│   │   └── consent.py                   # ConsentGrant, ConsentRevoke, ConsentStatus
│   │
│   ├── routers/                         # API route handlers (thin — delegate to services)
│   │   ├── __init__.py
│   │   ├── auth.py                      # /v1/auth/*
│   │   ├── profile.py                   # /v1/profile
│   │   ├── family_members.py            # /v1/family-members/*
│   │   ├── files.py                     # /v1/files/*
│   │   ├── reports.py                   # /v1/reports/*
│   │   ├── share.py                     # /v1/share-links/*, /v1/shared/*
│   │   └── consents.py                  # /v1/consents/*
│   │
│   ├── services/                        # Business logic (DB queries, external calls)
│   │   ├── __init__.py
│   │   ├── auth_service.py              # Login/register logic
│   │   ├── otp_service.py               # OTP generate, store, verify (Redis)
│   │   ├── sms_service.py               # SMS provider interface + implementations
│   │   ├── token_service.py             # JWT create, verify, refresh rotation
│   │   ├── profile_service.py           # Profile + self-member creation
│   │   ├── family_service.py            # Family member CRUD
│   │   ├── storage_service.py           # S3/GCS signed URL generation
│   │   ├── file_service.py              # File record management
│   │   ├── report_service.py            # Report CRUD, list with filters
│   │   ├── extraction_service.py        # AI extraction trigger (stub for now)
│   │   ├── value_service.py             # Extracted value edit, status calc
│   │   ├── trend_service.py             # Trend and health summary queries
│   │   ├── share_service.py             # Share link CRUD, public view
│   │   ├── consent_service.py           # Consent management
│   │   └── audit_service.py             # Audit log writer
│   │
│   ├── middleware/                       # FastAPI middleware
│   │   ├── __init__.py
│   │   ├── rate_limit.py                # Redis sliding window rate limiter
│   │   ├── security_headers.py          # X-Frame-Options, CSP, etc.
│   │   └── request_id.py               # X-Request-ID generation
│   │
│   └── utils/                           # Pure utility functions
│       ├── __init__.py
│       ├── security.py                  # Password hashing, token generation
│       ├── pagination.py                # Paginate query helper
│       ├── validators.py                # Phone, file type, blood group validators
│       └── status_calculator.py         # Medical value status logic
│
├── migrations/                          # Alembic
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 001_create_users.py
│       ├── 002_create_profiles.py
│       ├── 003_create_family_members.py
│       ├── 004_create_uploaded_files.py
│       ├── 005_create_medical_reports.py
│       ├── 006_create_report_metadata.py
│       ├── 007_create_extracted_values.py
│       ├── 008_create_parameter_definitions.py
│       ├── 009_create_share_links.py
│       ├── 010_create_consent_logs.py
│       ├── 011_create_audit_logs.py
│       └── 012_create_refresh_tokens.py
│
├── tests/
│   ├── conftest.py                      # Fixtures: test DB, client, auth helpers
│   ├── factories.py                     # factory_boy model factories
│   ├── test_health.py
│   ├── test_auth.py
│   ├── test_profile.py
│   ├── test_family_members.py
│   ├── test_files.py
│   ├── test_reports.py
│   ├── test_share.py
│   ├── test_consents.py
│   ├── test_audit.py
│   └── test_rate_limit.py
│
├── scripts/
│   ├── seed_parameters.py               # Seed parameter_definitions
│   └── cleanup_orphan_files.py          # Cron: delete pending files older than 24h
│
├── alembic.ini
├── pyproject.toml                       # or requirements.txt
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── .pre-commit-config.yaml
├── .gitignore
└── README.md
```

---

## Git Branch Strategy

### Branch Model: GitHub Flow (Simplified)

```
main ────────────────────────────────────────────────────── (production)
  │
  ├── develop ───────────────────────────────────────────── (staging)
  │     │
  │     ├── feature/sprint1-project-setup ──── PR → develop
  │     ├── feature/sprint2-auth-module ────── PR → develop
  │     ├── feature/sprint2-otp-service ────── PR → develop
  │     ├── feature/sprint3-profile ────────── PR → develop
  │     ├── feature/sprint3-family-members ─── PR → develop
  │     ├── feature/sprint4-file-upload ────── PR → develop
  │     ├── feature/sprint5-reports ────────── PR → develop
  │     ├── feature/sprint5-share-links ────── PR → develop
  │     ├── feature/sprint6-audit-consent ──── PR → develop
  │     └── feature/sprint7-testing ────────── PR → develop
  │
  └── release/v1.0.0 ── merge develop → release → main (with tag)
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/{sprint}-{description}` | `feature/sprint2-otp-service` |
| Bugfix | `fix/{description}` | `fix/otp-cooldown-race-condition` |
| Hotfix | `hotfix/{description}` | `hotfix/jwt-secret-rotation` |
| Release | `release/v{major}.{minor}.{patch}` | `release/v1.0.0` |

### Rules

| Rule | Enforcement |
|------|-------------|
| No direct pushes to `main` or `develop` | Branch protection rules |
| Every PR requires 1 approval | GitHub PR settings |
| CI must pass before merge | Required status checks |
| Squash merge to develop | Keep history clean |
| Merge commit from develop to main | Preserve release history |
| Delete branch after merge | Auto-delete in GitHub settings |

### Commit Message Format

```
type(scope): short description

body (optional — explain WHY, not WHAT)

Refs: #issue-number
```

**Types:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`
**Scopes:** `auth`, `profile`, `family`, `file`, `report`, `share`, `consent`, `audit`, `config`

**Examples:**
```
feat(auth): implement OTP send with Redis rate limiting
fix(report): exclude soft-deleted reports from list query
test(file): add upload flow integration tests
chore(ci): add ruff linter to GitHub Actions pipeline
```

---

## Code Quality Rules

### Linting & Formatting

| Tool | Purpose | Config |
|------|---------|--------|
| **Ruff** | Linting + import sorting | `pyproject.toml` — rules: E, F, I, N, UP, B, S, T20 |
| **Black** | Code formatting | Line length: 100, Python 3.12 target |
| **mypy** | Static type checking | Strict mode, disallow untyped defs |
| **pre-commit** | Run all on commit | `.pre-commit-config.yaml` |

### Code Rules

| Rule | Enforce |
|------|---------|
| All functions have type hints | mypy strict |
| All Pydantic models use `ConfigDict` | Code review |
| Routers are thin — max 20 lines per endpoint | Code review |
| All business logic in services, not routers | Code review |
| No `print()` statements — use structlog | Ruff T20 rule |
| No hardcoded secrets | Ruff S105/S106 rules |
| No `eval()` or `exec()` | Ruff S307 rule |
| All DB queries use parameterized statements | Code review + SQLAlchemy ORM |
| All API responses use response schemas | FastAPI `response_model` |
| All endpoints have docstrings | Code review |
| Max function length: 50 lines | Code review |
| Max file length: 300 lines | Code review |
| No circular imports | mypy + manual review |

### pyproject.toml Config

```toml
[tool.ruff]
target-version = "py312"
line-length = 100
select = ["E", "F", "I", "N", "UP", "B", "S", "T20", "RET", "SIM"]
ignore = ["S101"]  # allow assert in tests

[tool.black]
target-version = ["py312"]
line-length = 100

[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## Backend Environment Setup

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.12+ | Runtime |
| PostgreSQL | 16+ | Primary database |
| Redis | 7+ | OTP storage, rate limiting, cache |
| Docker | 24+ | Containerization |
| Docker Compose | v2+ | Multi-container orchestration |
| Git | 2.40+ | Version control |
| AWS CLI | v2 | S3 management (if using AWS) |

### Environment Variables

```env
# ── Application ──────────────────────────────────────────
APP_ENV=development                           # development | staging | production
APP_NAME=MediVault API
APP_VERSION=1.0.0
APP_URL=http://localhost:8000
APP_PORT=8000
APP_WORKERS=1                                 # production: 4
DEBUG=true                                    # production: false
LOG_LEVEL=DEBUG                               # production: INFO

# ── Database ─────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://medivault:medivault@localhost:5432/medivault
DB_POOL_SIZE=10                               # production: 20
DB_MAX_OVERFLOW=5                             # production: 10
DB_ECHO=true                                  # production: false

# ── Redis ────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ── JWT ──────────────────────────────────────────────────
JWT_SECRET_KEY=change-me-to-random-256-bit-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# ── Storage ──────────────────────────────────────────────
STORAGE_PROVIDER=local                        # local | s3 | gcs
# For S3:
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=medivault-uploads
AWS_S3_REGION=ap-south-1
# For local (MinIO):
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# ── SMS ──────────────────────────────────────────────────
SMS_PROVIDER=console                          # console | twilio | msg91
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
OTP_DEV_BYPASS=true                           # production: false (allows OTP 000000)

# ── CORS ─────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# ── Rate Limiting ────────────────────────────────────────
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=100/minute
RATE_LIMIT_AUTH=3/15minutes
RATE_LIMIT_UPLOAD=20/hour
```

---

## Local Development Setup

### Step-by-Step

```bash
# 1. Clone repository
git clone https://github.com/your-org/medivault-api.git
cd medivault-api

# 2. Copy environment file
cp .env.example .env
# Edit .env — set JWT_SECRET_KEY to any random string for local dev

# 3. Start infrastructure (PostgreSQL + Redis + MinIO)
docker compose up -d postgres redis minio

# 4. Create Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 5. Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt    # ruff, black, mypy, pytest, factory_boy

# 6. Run database migrations
alembic upgrade head

# 7. Seed parameter definitions
python scripts/seed_parameters.py

# 8. Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 9. Open API docs
# http://localhost:8000/docs      (Swagger UI)
# http://localhost:8000/redoc     (ReDoc)

# 10. Run tests
pytest -v --cov=app

# 11. Run linters
ruff check .
black --check .
mypy app/
```

### Docker Compose — Full Stack

```yaml
# docker-compose.yml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./app:/code/app    # hot reload in dev
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: medivault
      POSTGRES_PASSWORD: medivault
      POSTGRES_DB: medivault
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medivault"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

### Makefile Commands

```makefile
.PHONY: dev test lint migrate seed clean

dev:                    ## Start dev server with hot reload
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

infra:                  ## Start PostgreSQL + Redis + MinIO
	docker compose up -d postgres redis minio

test:                   ## Run all tests with coverage
	pytest -v --cov=app --cov-report=term-missing

test-fast:              ## Run tests without coverage
	pytest -v -x --timeout=10

lint:                   ## Run all linters
	ruff check .
	black --check .
	mypy app/

format:                 ## Auto-format code
	ruff check --fix .
	black .

migrate:                ## Run database migrations
	alembic upgrade head

migrate-down:           ## Rollback last migration
	alembic downgrade -1

migrate-new:            ## Create new migration
	alembic revision --autogenerate -m "$(msg)"

seed:                   ## Seed parameter definitions
	python scripts/seed_parameters.py

clean:                  ## Remove containers and volumes
	docker compose down -v

logs:                   ## Tail app logs
	docker compose logs -f app
```

---

## Staging Deployment Checklist

### Infrastructure

- [ ] **Server:** AWS EC2 t3.small / GCP e2-small (2 vCPU, 2 GB RAM)
- [ ] **Database:** AWS RDS PostgreSQL 16 (db.t3.micro) or GCP Cloud SQL
- [ ] **Redis:** AWS ElastiCache (cache.t3.micro) or GCP Memorystore
- [ ] **Storage:** AWS S3 bucket `medivault-staging-uploads`
- [ ] **Domain:** `api-staging.medivault.app` (A record → EC2/GCP IP)
- [ ] **SSL:** Let's Encrypt certificate via Certbot or AWS ACM
- [ ] **Load Balancer:** Not needed for staging (direct to server)

### Configuration

- [ ] Set `APP_ENV=staging`
- [ ] Set `DEBUG=false`
- [ ] Set `LOG_LEVEL=INFO`
- [ ] Set `OTP_DEV_BYPASS=true` (staging allows test OTP)
- [ ] Set `CORS_ORIGINS` to staging frontend URL
- [ ] Generate unique `JWT_SECRET_KEY` for staging (not same as production)
- [ ] Configure real SMS provider (or keep console for staging)
- [ ] Set `STORAGE_PROVIDER=s3` with staging bucket credentials
- [ ] Set `APP_WORKERS=2`

### Deployment Steps

```bash
# 1. SSH into staging server
ssh deploy@staging.medivault.app

# 2. Pull latest code
cd /opt/medivault-api
git pull origin develop

# 3. Build Docker image
docker build -t medivault-api:staging .

# 4. Run migrations
docker compose -f docker-compose.staging.yml run --rm app alembic upgrade head

# 5. Seed data (first deploy only)
docker compose -f docker-compose.staging.yml run --rm app python scripts/seed_parameters.py

# 6. Deploy
docker compose -f docker-compose.staging.yml up -d

# 7. Verify
curl https://api-staging.medivault.app/health
# Expected: {"status": "healthy", ...}

# 8. Check logs
docker compose -f docker-compose.staging.yml logs -f app
```

### Validation

- [ ] Health endpoint returns healthy
- [ ] OTP send works (console or SMS)
- [ ] Full auth flow works
- [ ] File upload to S3 works
- [ ] Swagger UI accessible at `/docs`
- [ ] CORS allows staging frontend
- [ ] Rate limiting active

---

## Production Deployment Checklist

### Infrastructure

- [ ] **Compute:** AWS ECS Fargate / GCP Cloud Run (auto-scaling, 2–8 instances)
- [ ] **Database:** AWS RDS PostgreSQL 16 (db.r6g.large, Multi-AZ, 100 GB)
  - [ ] Automated backups: daily, 30-day retention
  - [ ] Point-in-time recovery enabled
  - [ ] Encryption at rest enabled (AES-256)
  - [ ] Private subnet — no public access
- [ ] **Redis:** AWS ElastiCache (cache.r6g.large, cluster mode)
  - [ ] Encryption in transit and at rest
  - [ ] Private subnet
- [ ] **Storage:** AWS S3 bucket `medivault-prod-uploads`
  - [ ] Block all public access
  - [ ] Versioning enabled
  - [ ] Lifecycle: IA after 90 days, Glacier after 365 days
  - [ ] Server-side encryption (SSE-S3)
  - [ ] Access logging enabled
- [ ] **Domain:** `api.medivault.app` → ALB → ECS
- [ ] **SSL:** AWS ACM certificate (auto-renew)
- [ ] **Load Balancer:** AWS ALB with health check on `/health`
- [ ] **CDN:** CloudFront not needed (API only, no static assets)
- [ ] **Monitoring:** CloudWatch alarms for CPU, memory, 5xx rate, latency
- [ ] **Logging:** CloudWatch Logs or ELK stack
- [ ] **Secrets:** AWS Secrets Manager for JWT key, DB password, SMS credentials

### Configuration

- [ ] `APP_ENV=production`
- [ ] `DEBUG=false`
- [ ] `LOG_LEVEL=INFO`
- [ ] `OTP_DEV_BYPASS=false` — NO test OTP in production
- [ ] `CORS_ORIGINS=https://medivault.app`
- [ ] `JWT_SECRET_KEY` from Secrets Manager (256-bit random)
- [ ] `DATABASE_URL` from Secrets Manager (RDS endpoint)
- [ ] `REDIS_URL` from Secrets Manager (ElastiCache endpoint)
- [ ] `APP_WORKERS=4` (per container)
- [ ] `DB_POOL_SIZE=20`, `DB_MAX_OVERFLOW=10`
- [ ] Real SMS provider configured (Twilio or MSG91)
- [ ] Rate limiting enabled

### Pre-Deploy Checks

- [ ] All tests pass on `develop` branch
- [ ] Code coverage ≥ 80%
- [ ] No ruff or mypy warnings
- [ ] Security audit completed — no critical findings
- [ ] Load test passed — 100 concurrent users, p95 < 500ms
- [ ] Database migration tested on staging first
- [ ] Rollback plan documented

### Deployment Steps

```bash
# 1. Create release branch
git checkout develop
git pull
git checkout -b release/v1.0.0

# 2. Update version in pyproject.toml
# version = "1.0.0"

# 3. Build and push Docker image
docker build -t medivault-api:v1.0.0 .
docker tag medivault-api:v1.0.0 <aws-ecr-url>/medivault-api:v1.0.0
docker push <aws-ecr-url>/medivault-api:v1.0.0

# 4. Run migrations (via ECS run-task or bastion)
aws ecs run-task --task-definition medivault-migrate --command "alembic upgrade head"

# 5. Deploy new task definition with v1.0.0 image
aws ecs update-service --service medivault-api --force-new-deployment

# 6. Monitor rolling deployment
aws ecs wait services-stable --services medivault-api

# 7. Verify
curl https://api.medivault.app/health

# 8. Merge to main and tag
git checkout main
git merge release/v1.0.0
git tag v1.0.0
git push origin main --tags

# 9. Cleanup
git branch -d release/v1.0.0
```

### Post-Deploy Checks

- [ ] Health check returns healthy
- [ ] Auth flow works end-to-end
- [ ] File upload and download work
- [ ] CloudWatch shows no 5xx errors
- [ ] Response latency within expected range
- [ ] Database connections stable
- [ ] Redis connections stable

### Rollback Plan

```bash
# If issues detected:
# 1. Update ECS task definition to previous image version
aws ecs update-service --service medivault-api \
  --task-definition medivault-api:previous-revision

# 2. If migration needs rollback:
aws ecs run-task --task-definition medivault-migrate \
  --command "alembic downgrade -1"

# 3. Monitor
aws ecs wait services-stable --services medivault-api
```

---

## Security Checklist

### Authentication & Authorization

- [ ] OTP is 6 digits, cryptographically random (`secrets.randbelow`)
- [ ] OTP stored in Redis with 5-min TTL — never in database
- [ ] Max 5 OTP verification attempts per phone per 15 min
- [ ] Max 3 OTP sends per phone per 15 min
- [ ] 60-second cooldown between OTP sends
- [ ] JWT access tokens expire in 15 min
- [ ] JWT refresh tokens expire in 30 days
- [ ] Refresh token rotation — old token revoked on each use
- [ ] JWT secret is 256-bit random, loaded from env/secrets manager
- [ ] JWT `alg` header is verified server-side (prevent `alg: none` attack)
- [ ] All protected endpoints check `Authorization: Bearer` header
- [ ] User can only access own resources (ownership check on every query)

### Data Security

- [ ] All file access through signed URLs — no public S3 bucket policy
- [ ] Signed download URLs expire in 15 minutes
- [ ] Signed upload URLs expire in 10 minutes
- [ ] S3 bucket: "Block all public access" enabled
- [ ] S3 server-side encryption enabled (SSE-S3 or SSE-KMS)
- [ ] Share link passwords hashed with bcrypt (cost factor 12)
- [ ] Share link tokens are 64-char `secrets.token_urlsafe`
- [ ] Database encrypted at rest (RDS encryption)
- [ ] Database connections use SSL in production
- [ ] Redis connections use TLS in production
- [ ] No sensitive data in URL query parameters
- [ ] No sensitive data in logs (mask phone, email in structlog)

### Input Validation

- [ ] All input validated via Pydantic schemas (type + constraints)
- [ ] Phone number validated as E.164 format
- [ ] File type validated (PDF, JPEG, PNG, WebP only)
- [ ] File size validated (max 20 MB)
- [ ] Text fields sanitized — no raw HTML/script injection
- [ ] UUID format validated on all path parameters
- [ ] Enum fields validated (gender, blood_group, relation, etc.)
- [ ] No SQL string concatenation — all queries parameterized (SQLAlchemy ORM)
- [ ] Pydantic validation errors return 400 (not 422 with stacktrace)

### API Security

- [ ] CORS restricted to known origins only
- [ ] Rate limiting on all endpoints (Redis sliding window)
- [ ] Security headers on all responses (X-Frame, CSP, HSTS, etc.)
- [ ] Request ID on every request for tracing
- [ ] No detailed error messages in production (no stack traces)
- [ ] Audit log for all mutations — append-only, no delete
- [ ] Soft delete on all user data — no hard deletes
- [ ] HTTPS only in production (redirect HTTP → HTTPS)

### OWASP Top 10 Compliance

| # | Vulnerability | Status |
|---|--------------|--------|
| A01 | Broken Access Control | Row-level ownership check on all queries |
| A02 | Cryptographic Failures | bcrypt passwords, HS256 JWT, S3 encryption |
| A03 | Injection | SQLAlchemy ORM (parameterized), Pydantic validation |
| A04 | Insecure Design | Signed URLs, no public file access, rate limiting |
| A05 | Security Misconfiguration | CORS restricted, security headers, no debug in prod |
| A06 | Vulnerable Components | Dependabot alerts, pin exact versions |
| A07 | Auth Failures | OTP rate limit, JWT expiry, refresh rotation |
| A08 | Data Integrity Failures | SHA-256 file checksum, audit log immutability |
| A09 | Logging Failures | Structured logging, audit trail, no sensitive data in logs |
| A10 | SSRF | No user-controlled URLs fetched server-side |

---

## API Testing Checklist (Postman)

### Collection Structure

```
MediVault API
├── Environment Variables
│   ├── {{base_url}} = http://localhost:8000/v1
│   ├── {{access_token}} = (auto-set after login)
│   ├── {{refresh_token}} = (auto-set after login)
│   ├── {{user_id}} = (auto-set after login)
│   ├── {{profile_id}} = (auto-set after profile create)
│   ├── {{member_id}} = (auto-set after member create)
│   ├── {{file_id}} = (auto-set after upload request)
│   ├── {{report_id}} = (auto-set after report create)
│   ├── {{value_id}} = (auto-set from report detail)
│   └── {{share_token}} = (auto-set after share create)
│
├── 01 — Health
│   └── GET /health
│
├── 02 — Auth
│   ├── POST /auth/otp/send
│   ├── POST /auth/otp/verify → saves tokens to env
│   ├── POST /auth/token/refresh → saves new tokens
│   ├── POST /auth/logout
│   ├── POST /auth/google
│   ├── [ERROR] OTP cooldown (within 60s)
│   ├── [ERROR] OTP max sends (4th in 15 min)
│   ├── [ERROR] Wrong OTP
│   ├── [ERROR] Expired OTP
│   └── [ERROR] Invalid phone format
│
├── 03 — Profile
│   ├── POST /profile → saves profile_id
│   ├── GET /profile
│   ├── PATCH /profile
│   ├── [ERROR] Duplicate profile
│   └── [ERROR] No auth token
│
├── 04 — Family Members
│   ├── GET /family-members
│   ├── POST /family-members → saves member_id
│   ├── PATCH /family-members/:id
│   ├── DELETE /family-members/:id
│   ├── PATCH /family-members/:id/set-default
│   ├── [ERROR] Delete self member
│   ├── [ERROR] 11th member
│   └── [ERROR] Access other user's member
│
├── 05 — File Upload
│   ├── POST /files/upload-url → saves file_id, upload_url
│   ├── PUT {{upload_url}} (direct S3 upload)
│   ├── POST /files/:id/confirm
│   ├── GET /files/:id/url
│   ├── [ERROR] Invalid file type
│   ├── [ERROR] File too large
│   └── [ERROR] Access other user's file
│
├── 06 — Reports
│   ├── POST /reports → saves report_id
│   ├── GET /reports (no filters)
│   ├── GET /reports?report_type=blood_test
│   ├── GET /reports?search=Apollo
│   ├── GET /reports?date_from=2026-01-01&date_to=2026-12-31
│   ├── GET /reports?page=1&per_page=5
│   ├── GET /reports/:id → saves value_id
│   ├── PATCH /reports/:id
│   ├── DELETE /reports/:id
│   ├── PATCH /reports/:id/values/:vid (edit value)
│   ├── POST /reports/:id/confirm
│   ├── POST /reports/:id/extract
│   ├── GET /reports/:id/status
│   ├── POST /reports/:id/reprocess
│   ├── GET /reports/trends/HbA1c
│   ├── GET /reports/health-summary
│   ├── [ERROR] Report not found
│   └── [ERROR] Access other user's report
│
├── 07 — Share Links
│   ├── POST /share-links → saves share_token
│   ├── GET /share-links
│   ├── DELETE /share-links/:id
│   ├── GET /shared/:token (public)
│   ├── [ERROR] Expired link
│   ├── [ERROR] Revoked link
│   ├── [ERROR] Password required
│   └── [ERROR] Wrong password
│
├── 08 — Consents
│   ├── POST /consents (grant AI processing)
│   ├── GET /consents
│   ├── POST /consents/revoke
│   └── [ERROR] Extraction without consent
│
└── 09 — Error Scenarios
    ├── 401 — No auth token
    ├── 401 — Expired token
    ├── 401 — Malformed token
    ├── 404 — Non-existent resource
    ├── 429 — Rate limit exceeded
    └── 500 — Internal error (test mode)
```

### Postman Test Scripts (Auto-save Tokens)

```javascript
// POST /auth/otp/verify — Tests tab:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Tokens returned", () => {
    const json = pm.response.json();
    pm.expect(json.data.access_token).to.be.a("string");
    pm.expect(json.data.refresh_token).to.be.a("string");
    
    // Auto-save to environment
    pm.environment.set("access_token", json.data.access_token);
    pm.environment.set("refresh_token", json.data.refresh_token);
    pm.environment.set("user_id", json.data.user.id);
});

// Auth header — Collection-level Pre-request:
if (pm.environment.get("access_token")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("access_token")
    });
}
```

### Test Run Order

Run folders in sequence: Auth → Profile → Family → Upload → Reports → Share → Consents → Errors. Each folder auto-saves IDs needed by the next.

---

## Final Handover Checklist

### Code & Repository

- [ ] All code merged to `develop` branch
- [ ] All PRs reviewed and approved
- [ ] No open TODO/FIXME comments in code (except documented future items)
- [ ] `.gitignore` excludes: `.env`, `__pycache__`, `.pytest_cache`, `venv/`, `*.pyc`
- [ ] `LICENSE` file present (if applicable)
- [ ] Branch protection rules configured on `main` and `develop`

### Documentation

- [ ] `README.md` — project overview, setup, run, test, deploy
- [ ] `MEDIVAULT_BACKEND_API_SCHEMA.md` — complete API + DB documentation
- [ ] `MEDIVAULT_SPRINT_EXECUTION_PLAN.md` — this document
- [ ] `CHANGELOG.md` — version history with breaking changes
- [ ] `.env.example` — all variables documented with descriptions
- [ ] API docs live at `/docs` (Swagger) and `/redoc` (ReDoc)
- [ ] `openapi.json` exportable from `/openapi.json`
- [ ] Architecture diagram in README

### Database

- [ ] All 12 Alembic migrations run successfully (up and down)
- [ ] `parameter_definitions` seeded with 20 medical parameters
- [ ] Database backup procedure documented and tested
- [ ] Restore from backup tested at least once
- [ ] Query performance acceptable — slow query log reviewed

### Testing

- [ ] pytest passes — 0 failures
- [ ] Coverage ≥ 80%
- [ ] All 30 endpoints have happy path + error path tests
- [ ] Auth flow integration test passes
- [ ] File upload integration test passes
- [ ] Postman collection exported and shared
- [ ] Load test results documented (100 concurrent, p95 < 500ms)

### Security

- [ ] OWASP Top 10 audit completed
- [ ] No hardcoded secrets in code
- [ ] No public S3 bucket access
- [ ] Rate limiting configured and tested
- [ ] JWT secret rotated from any dev/staging value
- [ ] Database credentials rotated from any dev/staging value
- [ ] SSL/TLS configured end-to-end

### Infrastructure

- [ ] Staging environment operational
- [ ] Production environment provisioned (or documented for provisioning)
- [ ] CI/CD pipeline operational (lint + test on PR, deploy on merge)
- [ ] Monitoring and alerting configured (5xx rate, latency, CPU/memory)
- [ ] Log aggregation configured (CloudWatch / ELK)
- [ ] Incident response runbook documented

### Future Integration Readiness

- [ ] AI extraction service interface defined (`extraction_service.py`)
- [ ] Extraction endpoint accepts webhook callback URL
- [ ] `extracted_values` table ready for AI pipeline output
- [ ] `parameter_definitions` table extensible for new parameters
- [ ] `report_metadata.extraction_engine` tracks which AI model was used
- [ ] Processing status flow supports async job queue (Celery/SQS ready)
- [ ] Analytics queries (trends, health summary) performant with indexes
- [ ] Share link public view works independently for doctor-facing portal

### Knowledge Transfer

- [ ] 1-hour walkthrough session with receiving developer(s)
- [ ] Architecture decisions documented (why FastAPI, why UUID, why S3 signed URLs)
- [ ] Known limitations listed (Phase 1 scope boundaries)
- [ ] Future improvements backlog created (cursor pagination, full-text search, WebSocket status)

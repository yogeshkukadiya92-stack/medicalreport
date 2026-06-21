# MediVault — Backend Database Schema & REST API Documentation

> **Stack:** Python FastAPI · PostgreSQL · AWS S3 / GCS · JWT Auth
> **Version:** Phase 1 — MVP
> **Date:** June 2026
> **Status:** Ready for developer implementation

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [SQL Schema](#3-sql-schema)
4. [API Standards & Conventions](#4-api-standards--conventions)
5. [Auth API](#5-auth-api)
6. [User Profile API](#6-user-profile-api)
7. [Family Members API](#7-family-members-api)
8. [File Upload API](#8-file-upload-api)
9. [Medical Reports API](#9-medical-reports-api)
10. [AI Extraction API](#10-ai-extraction-api)
11. [Doctor Sharing API](#11-doctor-sharing-api)
12. [Consent Logs API](#12-consent-logs-api)
13. [Audit Log Strategy](#13-audit-log-strategy)
14. [Pagination, Search & Filter](#14-pagination-search--filter)
15. [Error Handling](#15-error-handling)
16. [Implementation Notes](#16-implementation-notes)

---

## 1. Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Mobile App  │     │   Web App    │     │  Admin Panel     │
│  (Android)   │     │  (React)     │     │  (Internal)      │
└──────┬───────┘     └──────┬───────┘     └──────┬───────────┘
       │                    │                    │
       └────────────┬───────┘────────────────────┘
                    │
            ┌───────▼───────┐
            │   API Gateway │      ← Rate limiting, CORS
            │   (FastAPI)   │
            └───────┬───────┘
                    │
       ┌────────────┼────────────┐
       │            │            │
┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐
│ PostgreSQL  │ │  S3 / │ │   Redis   │
│  Database   │ │  GCS  │ │  (Cache/  │
│             │ │       │ │   OTP)    │
└─────────────┘ └───────┘ └───────────┘
```

### Key Principles

| Principle | Implementation |
|-----------|---------------|
| Auth | JWT (access + refresh tokens), phone OTP via SMS gateway |
| File Security | No public URLs. All file access via signed URLs (15-min expiry) |
| Soft Delete | All user-facing tables use `deleted_at` timestamp instead of hard delete |
| Timestamps | All tables include `created_at` and `updated_at` (UTC, auto-managed) |
| UUIDs | All primary keys use UUID v4 (not sequential integers) |
| Audit | Write-ahead audit log for all mutations on sensitive tables |
| Multi-tenancy | Row-level isolation via `user_id` foreign key on all data tables |

---

## 2. Database Schema

### Entity Relationship Summary

```
users
 ├── user_profiles (1:1)
 ├── family_members (1:N)
 │    └── medical_reports (1:N)
 │         ├── uploaded_files (1:N)
 │         ├── report_metadata (1:1)
 │         ├── extracted_values (1:N)        ← AI extraction
 │         └── report_share_links (1:N)
 ├── consent_logs (1:N)
 ├── audit_logs (1:N)
 └── refresh_tokens (1:N)
```

### Table Definitions

#### 2.1 `users`

Primary authentication entity. One row per registered user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT uuid_generate_v4() | User ID |
| `phone` | `VARCHAR(15)` | UNIQUE, NOT NULL | Phone with country code, e.g. +919876543210 |
| `email` | `VARCHAR(255)` | UNIQUE, NULLABLE | Optional email |
| `google_id` | `VARCHAR(255)` | UNIQUE, NULLABLE | Google OAuth subject ID |
| `phone_verified` | `BOOLEAN` | DEFAULT FALSE | OTP verification status |
| `email_verified` | `BOOLEAN` | DEFAULT FALSE | Email verification status |
| `is_active` | `BOOLEAN` | DEFAULT TRUE | Account active flag |
| `role` | `VARCHAR(20)` | DEFAULT 'user' | user / admin |
| `last_login_at` | `TIMESTAMPTZ` | NULLABLE | Last successful login |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Registration time |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Last update |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete |

**Indexes:** `idx_users_phone`, `idx_users_email`, `idx_users_google_id`

---

#### 2.2 `user_profiles`

Extended profile information. Created after first login.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Profile ID |
| `user_id` | `UUID` | FK → users.id, UNIQUE, NOT NULL | Owner |
| `full_name` | `VARCHAR(150)` | NOT NULL | Display name |
| `date_of_birth` | `DATE` | NULLABLE | DOB for age calculation |
| `age` | `SMALLINT` | NULLABLE | Manually entered age (if DOB not given) |
| `gender` | `VARCHAR(10)` | NULLABLE | male / female / other |
| `blood_group` | `VARCHAR(5)` | NULLABLE | A+, B-, O+, AB+, etc. |
| `known_conditions` | `TEXT[]` | DEFAULT '{}' | Array: diabetes, hypertension, thyroid, etc. |
| `emergency_contact_name` | `VARCHAR(150)` | NULLABLE | Emergency contact |
| `emergency_contact_phone` | `VARCHAR(15)` | NULLABLE | Emergency phone |
| `avatar_url` | `VARCHAR(500)` | NULLABLE | Profile picture (S3 key) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Indexes:** `idx_user_profiles_user_id`

---

#### 2.3 `family_members`

Additional profiles managed under one user account.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Member ID |
| `user_id` | `UUID` | FK → users.id, NOT NULL | Owner account |
| `full_name` | `VARCHAR(150)` | NOT NULL | Member name |
| `relation` | `VARCHAR(30)` | NOT NULL | self / spouse / parent / child / sibling / other |
| `date_of_birth` | `DATE` | NULLABLE | |
| `age` | `SMALLINT` | NULLABLE | |
| `gender` | `VARCHAR(10)` | NULLABLE | |
| `blood_group` | `VARCHAR(5)` | NULLABLE | |
| `known_conditions` | `TEXT[]` | DEFAULT '{}' | |
| `is_default` | `BOOLEAN` | DEFAULT FALSE | Active profile flag |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete |

**Indexes:** `idx_family_members_user_id`
**Constraint:** One row with `relation = 'self'` is auto-created from `user_profiles` data.

---

#### 2.4 `uploaded_files`

Raw files uploaded by the user. One report may have multiple pages/files.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | File ID |
| `user_id` | `UUID` | FK → users.id, NOT NULL | Owner |
| `report_id` | `UUID` | FK → medical_reports.id, NULLABLE | Linked report (set after report creation) |
| `storage_provider` | `VARCHAR(10)` | NOT NULL | s3 / gcs |
| `bucket_name` | `VARCHAR(100)` | NOT NULL | Storage bucket |
| `object_key` | `VARCHAR(500)` | NOT NULL, UNIQUE | Full path in bucket |
| `original_filename` | `VARCHAR(255)` | NOT NULL | User's original filename |
| `mime_type` | `VARCHAR(50)` | NOT NULL | application/pdf, image/jpeg, image/png |
| `file_size_bytes` | `BIGINT` | NOT NULL | Size in bytes |
| `checksum_sha256` | `VARCHAR(64)` | NOT NULL | Integrity hash |
| `page_number` | `SMALLINT` | DEFAULT 1 | For multi-page uploads |
| `upload_status` | `VARCHAR(20)` | DEFAULT 'pending' | pending / completed / failed |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete |

**Indexes:** `idx_uploaded_files_user_id`, `idx_uploaded_files_report_id`, `idx_uploaded_files_object_key`

**Storage Key Pattern:** `{user_id}/{year}/{month}/{file_uuid}.{ext}`
Example: `a1b2c3d4/2026/06/e5f6g7h8.pdf`

---

#### 2.5 `medical_reports`

Central report entity. One report = one medical test or document.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Report ID |
| `user_id` | `UUID` | FK → users.id, NOT NULL | Owner |
| `family_member_id` | `UUID` | FK → family_members.id, NOT NULL | For which member |
| `report_type` | `VARCHAR(50)` | NULLABLE | blood_test / thyroid / lipid / diabetes / xray / prescription / other |
| `report_title` | `VARCHAR(255)` | NULLABLE | Auto-generated or user-entered |
| `report_date` | `DATE` | NULLABLE | Date on the report (auto-detected or entered) |
| `lab_name` | `VARCHAR(200)` | NULLABLE | Lab / hospital name |
| `doctor_name` | `VARCHAR(200)` | NULLABLE | Referring doctor |
| `notes` | `TEXT` | NULLABLE | User notes |
| `source` | `VARCHAR(20)` | NOT NULL | camera / gallery / pdf / document |
| `processing_status` | `VARCHAR(30)` | DEFAULT 'uploaded' | See processing status table below |
| `ai_confidence_score` | `DECIMAL(5,2)` | NULLABLE | 0.00–100.00 overall extraction confidence |
| `is_starred` | `BOOLEAN` | DEFAULT FALSE | User bookmarked |
| `tags` | `TEXT[]` | DEFAULT '{}' | User-defined tags |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete |

**Indexes:**
- `idx_reports_user_id`
- `idx_reports_family_member_id`
- `idx_reports_report_type`
- `idx_reports_report_date`
- `idx_reports_processing_status`
- `idx_reports_created_at`

**Processing Status Values:**

| Status | Description |
|--------|-------------|
| `uploaded` | File received, awaiting processing |
| `processing` | AI extraction in progress |
| `review_pending` | Extraction done, awaiting user review |
| `completed` | User confirmed, report finalized |
| `failed` | AI extraction failed |
| `reprocessing` | User requested re-extraction |

---

#### 2.6 `report_metadata`

Extended metadata extracted or entered for a report. 1:1 with `medical_reports`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `report_id` | `UUID` | FK → medical_reports.id, UNIQUE, NOT NULL | |
| `detected_report_type` | `VARCHAR(50)` | NULLABLE | AI-detected type before user edit |
| `detected_lab_name` | `VARCHAR(200)` | NULLABLE | AI-detected lab |
| `detected_report_date` | `DATE` | NULLABLE | AI-detected date |
| `detected_patient_name` | `VARCHAR(200)` | NULLABLE | Name found on report |
| `detected_patient_age` | `VARCHAR(20)` | NULLABLE | Age/DOB found |
| `detected_doctor_name` | `VARCHAR(200)` | NULLABLE | |
| `raw_extracted_text` | `TEXT` | NULLABLE | Full OCR text output |
| `extraction_engine` | `VARCHAR(50)` | NULLABLE | ocr_v1 / gpt4_vision / gemini_vision |
| `extraction_duration_ms` | `INTEGER` | NULLABLE | Processing time |
| `page_count` | `SMALLINT` | DEFAULT 1 | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Indexes:** `idx_report_metadata_report_id`

---

#### 2.7 `extracted_values`

Individual medical parameter values extracted by AI. Future AI-ready table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `report_id` | `UUID` | FK → medical_reports.id, NOT NULL | |
| `parameter_name` | `VARCHAR(100)` | NOT NULL | Hemoglobin, HbA1c, TSH, etc. |
| `parameter_code` | `VARCHAR(50)` | NULLABLE | Standardized code (LOINC future) |
| `value` | `VARCHAR(50)` | NOT NULL | The extracted value |
| `unit` | `VARCHAR(30)` | NULLABLE | g/dL, mg/dL, %, mIU/L, etc. |
| `reference_range_low` | `DECIMAL(10,3)` | NULLABLE | Normal range lower bound |
| `reference_range_high` | `DECIMAL(10,3)` | NULLABLE | Normal range upper bound |
| `reference_range_text` | `VARCHAR(100)` | NULLABLE | Raw reference text from report |
| `status` | `VARCHAR(20)` | NULLABLE | normal / borderline / high / low / critical |
| `is_ai_extracted` | `BOOLEAN` | DEFAULT TRUE | FALSE if user manually entered |
| `is_user_verified` | `BOOLEAN` | DEFAULT FALSE | User confirmed this value |
| `is_user_edited` | `BOOLEAN` | DEFAULT FALSE | User changed the AI value |
| `original_ai_value` | `VARCHAR(50)` | NULLABLE | AI value before user edit |
| `confidence_score` | `DECIMAL(5,2)` | NULLABLE | 0–100, per-value confidence |
| `display_order` | `SMALLINT` | DEFAULT 0 | Ordering on screen |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Indexes:**
- `idx_extracted_values_report_id`
- `idx_extracted_values_parameter_name`
- Composite: `idx_extracted_values_report_param` ON (`report_id`, `parameter_name`)

---

#### 2.8 `parameter_definitions` (Reference Table)

Master list of known medical parameters. Seeded at deployment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `name` | `VARCHAR(100)` | UNIQUE, NOT NULL | Display name |
| `code` | `VARCHAR(50)` | UNIQUE, NULLABLE | LOINC or internal code |
| `category` | `VARCHAR(50)` | NOT NULL | blood, thyroid, diabetes, lipid, vitamin, liver, kidney |
| `unit` | `VARCHAR(30)` | NOT NULL | Default unit |
| `default_ref_low` | `DECIMAL(10,3)` | NULLABLE | Default normal range low |
| `default_ref_high` | `DECIMAL(10,3)` | NULLABLE | Default normal range high |
| `gender_specific` | `BOOLEAN` | DEFAULT FALSE | Different ranges by gender |
| `ref_low_male` | `DECIMAL(10,3)` | NULLABLE | |
| `ref_high_male` | `DECIMAL(10,3)` | NULLABLE | |
| `ref_low_female` | `DECIMAL(10,3)` | NULLABLE | |
| `ref_high_female` | `DECIMAL(10,3)` | NULLABLE | |
| `description` | `TEXT` | NULLABLE | What this parameter measures |
| `is_active` | `BOOLEAN` | DEFAULT TRUE | |

---

#### 2.9 `report_share_links`

Secure time-limited sharing with doctors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id, NOT NULL | Who shared |
| `share_token` | `VARCHAR(64)` | UNIQUE, NOT NULL | Secure random token |
| `doctor_name` | `VARCHAR(200)` | NULLABLE | |
| `hospital_name` | `VARCHAR(200)` | NULLABLE | |
| `report_ids` | `UUID[]` | NOT NULL | Array of shared report IDs |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Expiry time |
| `password_hash` | `VARCHAR(255)` | NULLABLE | Optional password protection (bcrypt) |
| `is_password_protected` | `BOOLEAN` | DEFAULT FALSE | |
| `max_views` | `INTEGER` | NULLABLE | Optional view limit |
| `view_count` | `INTEGER` | DEFAULT 0 | Times accessed |
| `is_revoked` | `BOOLEAN` | DEFAULT FALSE | Manually revoked by user |
| `last_viewed_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Indexes:** `idx_share_links_token`, `idx_share_links_user_id`, `idx_share_links_expires_at`

---

#### 2.10 `consent_logs`

Tracks user consent for AI processing, terms, and privacy.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id, NOT NULL | |
| `consent_type` | `VARCHAR(50)` | NOT NULL | ai_processing / terms_of_service / privacy_policy / data_sharing |
| `consent_version` | `VARCHAR(20)` | NOT NULL | e.g. "1.0", "2.1" |
| `is_granted` | `BOOLEAN` | NOT NULL | TRUE = accepted, FALSE = declined |
| `granted_at` | `TIMESTAMPTZ` | NULLABLE | When accepted |
| `revoked_at` | `TIMESTAMPTZ` | NULLABLE | When revoked |
| `ip_address` | `INET` | NULLABLE | IP at time of consent |
| `user_agent` | `VARCHAR(500)` | NULLABLE | Device info |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Indexes:** `idx_consent_logs_user_id`, composite `idx_consent_user_type` ON (`user_id`, `consent_type`)

---

#### 2.11 `audit_logs`

Immutable append-only log for all sensitive operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `BIGSERIAL` | PK | Sequential for ordering (not UUID) |
| `user_id` | `UUID` | NULLABLE | NULL for system actions |
| `action` | `VARCHAR(50)` | NOT NULL | See action list below |
| `resource_type` | `VARCHAR(50)` | NOT NULL | user / report / file / family_member / share_link |
| `resource_id` | `UUID` | NULLABLE | ID of affected resource |
| `details` | `JSONB` | NULLABLE | Before/after snapshot, extra context |
| `ip_address` | `INET` | NULLABLE | |
| `user_agent` | `VARCHAR(500)` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Immutable |

**Indexes:** `idx_audit_user_id`, `idx_audit_action`, `idx_audit_resource`, `idx_audit_created_at`
**Note:** This table is APPEND-ONLY. No UPDATE or DELETE operations.

**Action Values:** `user.register`, `user.login`, `user.logout`, `user.delete`, `profile.update`, `family_member.create`, `family_member.update`, `family_member.delete`, `report.upload`, `report.update`, `report.delete`, `report.view`, `file.upload`, `file.download`, `file.delete`, `share_link.create`, `share_link.view`, `share_link.revoke`, `consent.grant`, `consent.revoke`, `extraction.start`, `extraction.complete`, `extraction.fail`, `value.edit`

---

#### 2.12 `refresh_tokens`

JWT refresh token tracking for session management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id, NOT NULL | |
| `token_hash` | `VARCHAR(64)` | UNIQUE, NOT NULL | SHA-256 hash of refresh token |
| `device_info` | `VARCHAR(255)` | NULLABLE | Device identifier |
| `ip_address` | `INET` | NULLABLE | |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | |
| `is_revoked` | `BOOLEAN` | DEFAULT FALSE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Indexes:** `idx_refresh_tokens_user_id`, `idx_refresh_tokens_hash`

---

#### 2.13 `otp_requests` (Managed in Redis, schema for reference)

| Field | Type | TTL | Description |
|-------|------|-----|-------------|
| `otp:{phone}` | STRING | 5 min | The 6-digit OTP |
| `otp_attempts:{phone}` | INTEGER | 15 min | Failed verification count (max 5) |
| `otp_cooldown:{phone}` | STRING | 60 sec | Rate limit between OTP sends |

---

## 3. SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(255),
    google_id       VARCHAR(255),
    phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    role            VARCHAR(20) NOT NULL DEFAULT 'user',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_google_id UNIQUE (google_id),
    CONSTRAINT chk_users_role CHECK (role IN ('user', 'admin'))
);

CREATE INDEX idx_users_phone ON users (phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE user_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name               VARCHAR(150) NOT NULL,
    date_of_birth           DATE,
    age                     SMALLINT,
    gender                  VARCHAR(10),
    blood_group             VARCHAR(5),
    known_conditions        TEXT[] NOT NULL DEFAULT '{}',
    emergency_contact_name  VARCHAR(150),
    emergency_contact_phone VARCHAR(15),
    avatar_url              VARCHAR(500),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_profiles_user_id UNIQUE (user_id),
    CONSTRAINT chk_gender CHECK (gender IN ('male', 'female', 'other')),
    CONSTRAINT chk_blood_group CHECK (blood_group IN ('A+','A-','B+','B-','O+','O-','AB+','AB-'))
);

-- ============================================================
-- FAMILY MEMBERS
-- ============================================================
CREATE TABLE family_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name       VARCHAR(150) NOT NULL,
    relation        VARCHAR(30) NOT NULL,
    date_of_birth   DATE,
    age             SMALLINT,
    gender          VARCHAR(10),
    blood_group     VARCHAR(5),
    known_conditions TEXT[] NOT NULL DEFAULT '{}',
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT chk_fm_relation CHECK (relation IN ('self','spouse','parent','child','sibling','other')),
    CONSTRAINT chk_fm_gender CHECK (gender IN ('male','female','other')),
    CONSTRAINT chk_fm_blood CHECK (blood_group IN ('A+','A-','B+','B-','O+','O-','AB+','AB-'))
);

CREATE INDEX idx_family_members_user_id ON family_members (user_id) WHERE deleted_at IS NULL;

-- ============================================================
-- UPLOADED FILES
-- ============================================================
CREATE TABLE uploaded_files (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id         UUID,  -- set after report creation
    storage_provider  VARCHAR(10) NOT NULL,
    bucket_name       VARCHAR(100) NOT NULL,
    object_key        VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type         VARCHAR(50) NOT NULL,
    file_size_bytes   BIGINT NOT NULL,
    checksum_sha256   VARCHAR(64) NOT NULL,
    page_number       SMALLINT NOT NULL DEFAULT 1,
    upload_status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ,

    CONSTRAINT uq_files_object_key UNIQUE (object_key),
    CONSTRAINT chk_storage CHECK (storage_provider IN ('s3', 'gcs')),
    CONSTRAINT chk_mime CHECK (mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
    CONSTRAINT chk_upload_status CHECK (upload_status IN ('pending','completed','failed')),
    CONSTRAINT chk_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520) -- 20 MB
);

CREATE INDEX idx_uploaded_files_user_id ON uploaded_files (user_id);
CREATE INDEX idx_uploaded_files_report_id ON uploaded_files (report_id);

-- ============================================================
-- MEDICAL REPORTS
-- ============================================================
CREATE TABLE medical_reports (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id     UUID NOT NULL REFERENCES family_members(id),
    report_type          VARCHAR(50),
    report_title         VARCHAR(255),
    report_date          DATE,
    lab_name             VARCHAR(200),
    doctor_name          VARCHAR(200),
    notes                TEXT,
    source               VARCHAR(20) NOT NULL,
    processing_status    VARCHAR(30) NOT NULL DEFAULT 'uploaded',
    ai_confidence_score  DECIMAL(5,2),
    is_starred           BOOLEAN NOT NULL DEFAULT FALSE,
    tags                 TEXT[] NOT NULL DEFAULT '{}',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMPTZ,

    CONSTRAINT chk_source CHECK (source IN ('camera','gallery','pdf','document')),
    CONSTRAINT chk_processing CHECK (processing_status IN (
        'uploaded','processing','review_pending','completed','failed','reprocessing'
    ))
);

CREATE INDEX idx_reports_user_id ON medical_reports (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_family_member ON medical_reports (family_member_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_type ON medical_reports (report_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_date ON medical_reports (report_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_status ON medical_reports (processing_status);
CREATE INDEX idx_reports_created ON medical_reports (created_at DESC) WHERE deleted_at IS NULL;

-- Add FK from uploaded_files to medical_reports (deferred to avoid circular dependency)
ALTER TABLE uploaded_files
    ADD CONSTRAINT fk_files_report FOREIGN KEY (report_id) REFERENCES medical_reports(id);

-- ============================================================
-- REPORT METADATA
-- ============================================================
CREATE TABLE report_metadata (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id               UUID NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    detected_report_type    VARCHAR(50),
    detected_lab_name       VARCHAR(200),
    detected_report_date    DATE,
    detected_patient_name   VARCHAR(200),
    detected_patient_age    VARCHAR(20),
    detected_doctor_name    VARCHAR(200),
    raw_extracted_text      TEXT,
    extraction_engine       VARCHAR(50),
    extraction_duration_ms  INTEGER,
    page_count              SMALLINT NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_metadata_report UNIQUE (report_id)
);

-- ============================================================
-- EXTRACTED VALUES (AI-ready)
-- ============================================================
CREATE TABLE extracted_values (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id           UUID NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    parameter_name      VARCHAR(100) NOT NULL,
    parameter_code      VARCHAR(50),
    value               VARCHAR(50) NOT NULL,
    unit                VARCHAR(30),
    reference_range_low  DECIMAL(10,3),
    reference_range_high DECIMAL(10,3),
    reference_range_text VARCHAR(100),
    status              VARCHAR(20),
    is_ai_extracted     BOOLEAN NOT NULL DEFAULT TRUE,
    is_user_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    is_user_edited      BOOLEAN NOT NULL DEFAULT FALSE,
    original_ai_value   VARCHAR(50),
    confidence_score    DECIMAL(5,2),
    display_order       SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_ev_status CHECK (status IN ('normal','borderline','high','low','critical'))
);

CREATE INDEX idx_extracted_values_report ON extracted_values (report_id);
CREATE INDEX idx_extracted_values_param ON extracted_values (parameter_name);
CREATE INDEX idx_extracted_values_report_param ON extracted_values (report_id, parameter_name);

-- ============================================================
-- PARAMETER DEFINITIONS (Reference/Seed)
-- ============================================================
CREATE TABLE parameter_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(50),
    category        VARCHAR(50) NOT NULL,
    unit            VARCHAR(30) NOT NULL,
    default_ref_low  DECIMAL(10,3),
    default_ref_high DECIMAL(10,3),
    gender_specific BOOLEAN NOT NULL DEFAULT FALSE,
    ref_low_male    DECIMAL(10,3),
    ref_high_male   DECIMAL(10,3),
    ref_low_female  DECIMAL(10,3),
    ref_high_female DECIMAL(10,3),
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_param_name UNIQUE (name),
    CONSTRAINT uq_param_code UNIQUE (code)
);

-- ============================================================
-- REPORT SHARE LINKS
-- ============================================================
CREATE TABLE report_share_links (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_token         VARCHAR(64) NOT NULL,
    doctor_name         VARCHAR(200),
    hospital_name       VARCHAR(200),
    report_ids          UUID[] NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    password_hash       VARCHAR(255),
    is_password_protected BOOLEAN NOT NULL DEFAULT FALSE,
    max_views           INTEGER,
    view_count          INTEGER NOT NULL DEFAULT 0,
    is_revoked          BOOLEAN NOT NULL DEFAULT FALSE,
    last_viewed_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_share_token UNIQUE (share_token)
);

CREATE INDEX idx_share_links_token ON report_share_links (share_token);
CREATE INDEX idx_share_links_user ON report_share_links (user_id);
CREATE INDEX idx_share_links_expires ON report_share_links (expires_at);

-- ============================================================
-- CONSENT LOGS
-- ============================================================
CREATE TABLE consent_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type    VARCHAR(50) NOT NULL,
    consent_version VARCHAR(20) NOT NULL,
    is_granted      BOOLEAN NOT NULL,
    granted_at      TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    ip_address      INET,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_consent_type CHECK (consent_type IN (
        'ai_processing','terms_of_service','privacy_policy','data_sharing'
    ))
);

CREATE INDEX idx_consent_user ON consent_logs (user_id);
CREATE INDEX idx_consent_user_type ON consent_logs (user_id, consent_type);

-- ============================================================
-- AUDIT LOGS (Append-only)
-- ============================================================
CREATE TABLE audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    user_id       UUID,
    action        VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id   UUID,
    details       JSONB,
    ip_address    INET,
    user_agent    VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs (user_id);
CREATE INDEX idx_audit_action ON audit_logs (action);
CREATE INDEX idx_audit_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);

-- Prevent UPDATE and DELETE on audit_logs
CREATE RULE audit_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    device_info VARCHAR(255),
    ip_address  INET,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens (token_hash);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_family_updated BEFORE UPDATE ON family_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON medical_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_metadata_updated BEFORE UPDATE ON report_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_extracted_updated BEFORE UPDATE ON extracted_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: PARAMETER DEFINITIONS
-- ============================================================
INSERT INTO parameter_definitions (name, code, category, unit, default_ref_low, default_ref_high, gender_specific, ref_low_male, ref_high_male, ref_low_female, ref_high_female, description) VALUES
('Hemoglobin',        'HGB',   'blood',    'g/dL',    12.0,   17.5,   TRUE,  13.0, 17.0, 12.0, 15.5, 'Oxygen-carrying protein in red blood cells'),
('Fasting Blood Sugar','FBS',  'diabetes', 'mg/dL',   70.0,   110.0,  FALSE, NULL, NULL, NULL, NULL,  'Blood glucose after 8-hour fast'),
('HbA1c',             'A1C',   'diabetes', '%',       4.0,    5.7,    FALSE, NULL, NULL, NULL, NULL,  '3-month average blood sugar'),
('Total Cholesterol',  'CHOL',  'lipid',   'mg/dL',   0.0,    200.0,  FALSE, NULL, NULL, NULL, NULL,  'Total blood cholesterol'),
('HDL Cholesterol',    'HDL',   'lipid',   'mg/dL',   40.0,   60.0,   TRUE,  40.0, 60.0, 50.0, 60.0, 'Good cholesterol'),
('LDL Cholesterol',    'LDL',   'lipid',   'mg/dL',   0.0,    100.0,  FALSE, NULL, NULL, NULL, NULL,  'Bad cholesterol'),
('Triglycerides',      'TG',    'lipid',   'mg/dL',   0.0,    150.0,  FALSE, NULL, NULL, NULL, NULL,  'Fat in blood'),
('TSH',                'TSH',   'thyroid', 'mIU/L',   0.4,    4.0,    FALSE, NULL, NULL, NULL, NULL,  'Thyroid-stimulating hormone'),
('T3',                 'T3',    'thyroid', 'ng/dL',   80.0,   200.0,  FALSE, NULL, NULL, NULL, NULL,  'Triiodothyronine'),
('T4',                 'T4',    'thyroid', 'mcg/dL',  4.5,    12.0,   FALSE, NULL, NULL, NULL, NULL,  'Thyroxine'),
('Vitamin D',          'VITD',  'vitamin', 'ng/mL',   30.0,   100.0,  FALSE, NULL, NULL, NULL, NULL,  '25-hydroxyvitamin D'),
('Vitamin B12',        'B12',   'vitamin', 'pg/mL',   200.0,  900.0,  FALSE, NULL, NULL, NULL, NULL,  'Cobalamin'),
('Iron',               'FE',    'blood',   'mcg/dL',  60.0,   170.0,  TRUE,  65.0, 175.0, 50.0, 170.0, 'Serum iron'),
('Creatinine',         'CREAT', 'kidney',  'mg/dL',   0.6,    1.2,    TRUE,  0.7,  1.3,  0.6,  1.1,   'Kidney function marker'),
('SGPT (ALT)',         'ALT',   'liver',   'U/L',     7.0,    56.0,   FALSE, NULL, NULL, NULL, NULL,  'Liver enzyme'),
('SGOT (AST)',         'AST',   'liver',   'U/L',     10.0,   40.0,   FALSE, NULL, NULL, NULL, NULL,  'Liver enzyme'),
('Uric Acid',          'UA',    'kidney',  'mg/dL',   3.5,    7.2,    TRUE,  3.5,  7.2,  2.5,  6.2,   'Gout and kidney marker'),
('Blood Pressure Sys', 'BPS',   'vitals',  'mmHg',    90.0,   120.0,  FALSE, NULL, NULL, NULL, NULL,  'Systolic blood pressure'),
('Blood Pressure Dia', 'BPD',   'vitals',  'mmHg',    60.0,   80.0,   FALSE, NULL, NULL, NULL, NULL,  'Diastolic blood pressure'),
('BMI',                'BMI',   'vitals',  'kg/m²',   18.5,   24.9,   FALSE, NULL, NULL, NULL, NULL,  'Body Mass Index');
```

---

## 4. API Standards & Conventions

### Base URL
```
Production:  https://api.medivault.app/v1
Staging:     https://api-staging.medivault.app/v1
```

### Naming Rules

| Rule | Convention | Example |
|------|-----------|---------|
| URL paths | lowercase, kebab-case, plural nouns | `/v1/family-members` |
| Query params | snake_case | `?report_type=blood_test` |
| Request/response body | snake_case | `{ "full_name": "Rajesh" }` |
| HTTP methods | Standard REST verbs | GET, POST, PUT, PATCH, DELETE |
| Versioning | URL prefix | `/v1/...` |

### Authentication Header
```
Authorization: Bearer <access_token>
```

### Standard Response Envelope

**Success (single resource):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Profile updated successfully"
}
```

**Success (list):**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_items": 87,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Full name is required",
    "details": [
      {
        "field": "full_name",
        "message": "This field is required"
      }
    ]
  }
}
```

### Standard HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist or soft-deleted |
| 409 | Conflict | Duplicate resource (phone already registered) |
| 413 | Payload Too Large | File exceeds 20 MB |
| 415 | Unsupported Media Type | Invalid file type |
| 422 | Unprocessable Entity | Business logic error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_OTP_EXPIRED` | 400 | OTP has expired (5 min) |
| `AUTH_OTP_INVALID` | 400 | Wrong OTP code |
| `AUTH_OTP_MAX_ATTEMPTS` | 429 | 5 failed attempts, request new OTP |
| `AUTH_OTP_COOLDOWN` | 429 | Wait 60s before requesting new OTP |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired |
| `AUTH_TOKEN_INVALID` | 401 | Malformed or tampered token |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh token expired, re-login required |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `USER_DEACTIVATED` | 403 | Account is deactivated |
| `PHONE_ALREADY_REGISTERED` | 409 | Phone number in use |
| `PROFILE_ALREADY_EXISTS` | 409 | User already has a profile |
| `FAMILY_MEMBER_NOT_FOUND` | 404 | Family member ID invalid |
| `FAMILY_MEMBER_LIMIT` | 422 | Max 10 family members |
| `REPORT_NOT_FOUND` | 404 | Report ID invalid |
| `FILE_TOO_LARGE` | 413 | File exceeds 20 MB |
| `FILE_TYPE_NOT_ALLOWED` | 415 | Not a supported file type |
| `FILE_UPLOAD_FAILED` | 500 | Storage write failed |
| `SHARE_LINK_EXPIRED` | 410 | Link has expired |
| `SHARE_LINK_REVOKED` | 410 | Link manually revoked |
| `SHARE_PASSWORD_REQUIRED` | 403 | Password-protected link |
| `SHARE_PASSWORD_WRONG` | 403 | Incorrect password |
| `CONSENT_REQUIRED` | 403 | AI consent not granted |
| `VALIDATION_ERROR` | 400 | Generic field validation failure |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 5. Auth API

All auth endpoints are **public** (no Bearer token required).

### 5.1 Send OTP

```
POST /v1/auth/otp/send
```

**Request:**
```json
{
  "phone": "+919876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "phone": "+919876543210",
    "otp_expiry_seconds": 300,
    "is_new_user": true
  },
  "message": "OTP sent successfully"
}
```

**Error (429 — cooldown):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_OTP_COOLDOWN",
    "message": "Please wait 45 seconds before requesting a new OTP",
    "details": [{ "retry_after_seconds": 45 }]
  }
}
```

---

### 5.2 Verify OTP

```
POST /v1/auth/otp/verify
```

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "482731"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "phone": "+919876543210",
      "is_new_user": true,
      "has_profile": false,
      "has_consent": false
    }
  },
  "message": "Login successful"
}
```

**Error (400 — invalid):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_OTP_INVALID",
    "message": "Invalid OTP. 3 attempts remaining."
  }
}
```

**JWT Access Token Payload:**
```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "phone": "+919876543210",
  "role": "user",
  "iat": 1782000000,
  "exp": 1782000900
}
```

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access token | 15 minutes | Memory only (never localStorage) |
| Refresh token | 30 days | Secure HttpOnly cookie or encrypted storage |

---

### 5.3 Refresh Token

```
POST /v1/auth/token/refresh
```

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "bmV3IHJlZnJlc2ggdG9r...",
    "expires_in": 900
  }
}
```

Refresh token rotation: old token is revoked, new pair issued.

---

### 5.4 Logout

```
POST /v1/auth/logout
```
**Auth:** Required

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

Revokes the refresh token. Access token remains valid until expiry (short-lived).

---

### 5.5 Google OAuth

```
POST /v1/auth/google
```

**Request:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:** Same structure as OTP verify response.

---

## 6. User Profile API

All endpoints require **Auth: Bearer token**.

### 6.1 Create Profile

```
POST /v1/profile
```

**Request:**
```json
{
  "full_name": "Rajesh Kumar",
  "date_of_birth": "1981-03-15",
  "gender": "male",
  "blood_group": "B+",
  "known_conditions": ["diabetes", "thyroid"],
  "emergency_contact_name": "Priya Kumar",
  "emergency_contact_phone": "+919876500000"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "p1p2p3p4-p5p6-p7p8-p9p0-p1p2p3p4p5p6",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Rajesh Kumar",
    "date_of_birth": "1981-03-15",
    "age": 45,
    "gender": "male",
    "blood_group": "B+",
    "known_conditions": ["diabetes", "thyroid"],
    "emergency_contact_name": "Priya Kumar",
    "emergency_contact_phone": "+919876500000",
    "avatar_url": null,
    "created_at": "2026-06-21T10:00:00Z"
  },
  "message": "Profile created successfully"
}
```

**Side Effect:** Auto-creates a `family_members` row with `relation = 'self'` and `is_default = true`.

---

### 6.2 Get Profile

```
GET /v1/profile
```

**Response (200):** Same `data` structure as create response.

---

### 6.3 Update Profile

```
PATCH /v1/profile
```

Partial update — only send fields to change.

**Request:**
```json
{
  "known_conditions": ["diabetes", "thyroid", "hypertension"],
  "emergency_contact_phone": "+919876500001"
}
```

**Response (200):** Full updated profile in `data`.

---

## 7. Family Members API

**Auth:** Required. All operations scoped to the authenticated user.

### 7.1 List Family Members

```
GET /v1/family-members
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "fm-1111-2222-3333-444455556666",
      "full_name": "Rajesh Kumar",
      "relation": "self",
      "age": 45,
      "gender": "male",
      "blood_group": "B+",
      "known_conditions": ["diabetes", "thyroid"],
      "is_default": true,
      "report_count": 8,
      "created_at": "2026-06-21T10:00:00Z"
    },
    {
      "id": "fm-aaaa-bbbb-cccc-ddddeeeeffff",
      "full_name": "Priya Kumar",
      "relation": "spouse",
      "age": 40,
      "gender": "female",
      "blood_group": "A+",
      "known_conditions": [],
      "is_default": false,
      "report_count": 3,
      "created_at": "2026-06-21T10:05:00Z"
    }
  ]
}
```

---

### 7.2 Add Family Member

```
POST /v1/family-members
```

**Request:**
```json
{
  "full_name": "Mohan Kumar",
  "relation": "parent",
  "age": 72,
  "gender": "male",
  "blood_group": "O+",
  "known_conditions": ["hypertension"]
}
```

**Success Response (201):** Created member object.

**Error (422 — limit reached):**
```json
{
  "success": false,
  "error": {
    "code": "FAMILY_MEMBER_LIMIT",
    "message": "Maximum 10 family members allowed"
  }
}
```

---

### 7.3 Update Family Member

```
PATCH /v1/family-members/{member_id}
```

**Request (partial):**
```json
{
  "known_conditions": ["hypertension", "diabetes"]
}
```

**Response (200):** Updated member object.

---

### 7.4 Delete Family Member

```
DELETE /v1/family-members/{member_id}
```

Soft delete. Cannot delete `relation = 'self'`.

**Response (204):** No content.

**Error (422):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot delete your own profile. Use account deletion instead."
  }
}
```

---

### 7.5 Set Default Member

```
PATCH /v1/family-members/{member_id}/set-default
```

Sets this member as the active profile. Clears `is_default` on all others.

**Response (200):** Updated member object with `is_default: true`.

---

## 8. File Upload API

**Auth:** Required.

### 8.1 Upload File

Two-step process: (1) get presigned upload URL, (2) upload directly to S3/GCS.

#### Step 1: Request Upload URL

```
POST /v1/files/upload-url
```

**Request:**
```json
{
  "filename": "blood_test_report.pdf",
  "mime_type": "application/pdf",
  "file_size_bytes": 2456789
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "file_id": "f1f2f3f4-f5f6-f7f8-f9f0-f1f2f3f4f5f6",
    "upload_url": "https://medivault-uploads.s3.amazonaws.com/a1b2c3d4/2026/06/f1f2f3f4.pdf?X-Amz-Algorithm=...",
    "upload_method": "PUT",
    "upload_headers": {
      "Content-Type": "application/pdf",
      "x-amz-meta-user-id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    "expires_in_seconds": 600
  }
}
```

**Validation rules:**
- `mime_type` must be: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
- `file_size_bytes` must be > 0 and ≤ 20,971,520 (20 MB)

**Error (415):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TYPE_NOT_ALLOWED",
    "message": "Only PDF, JPEG, PNG, and WebP files are supported"
  }
}
```

**Error (413):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds the 20 MB limit"
  }
}
```

#### Step 2: Confirm Upload

After the client successfully uploads to S3/GCS:

```
POST /v1/files/{file_id}/confirm
```

**Request:**
```json
{
  "checksum_sha256": "a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "file_id": "f1f2f3f4-f5f6-f7f8-f9f0-f1f2f3f4f5f6",
    "upload_status": "completed",
    "file_size_bytes": 2456789,
    "mime_type": "application/pdf"
  },
  "message": "File upload confirmed"
}
```

Server verifies: file exists in storage, size matches, checksum matches.

---

### 8.2 Get Secure File URL

```
GET /v1/files/{file_id}/url
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "download_url": "https://medivault-uploads.s3.amazonaws.com/a1b2c3d4/2026/06/f1f2f3f4.pdf?X-Amz-Signature=...",
    "expires_in_seconds": 900
  }
}
```

Returns a **signed URL** valid for 15 minutes. Never exposes raw bucket URLs.

---

## 9. Medical Reports API

**Auth:** Required.

### 9.1 Create Report (After Upload)

```
POST /v1/reports
```

**Request:**
```json
{
  "family_member_id": "fm-1111-2222-3333-444455556666",
  "file_ids": ["f1f2f3f4-f5f6-f7f8-f9f0-f1f2f3f4f5f6"],
  "source": "pdf",
  "report_type": null,
  "report_title": null,
  "report_date": null,
  "lab_name": null,
  "doctor_name": null,
  "notes": null
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6",
    "family_member_id": "fm-1111-2222-3333-444455556666",
    "family_member_name": "Rajesh Kumar",
    "report_type": null,
    "report_title": null,
    "report_date": null,
    "lab_name": null,
    "source": "pdf",
    "processing_status": "uploaded",
    "files": [
      {
        "id": "f1f2f3f4-f5f6-f7f8-f9f0-f1f2f3f4f5f6",
        "original_filename": "blood_test_report.pdf",
        "mime_type": "application/pdf",
        "page_number": 1
      }
    ],
    "created_at": "2026-06-21T10:30:00Z"
  },
  "message": "Report created. Processing will begin shortly."
}
```

**Side effects:**
1. Links `file_ids` to this report (`uploaded_files.report_id` updated)
2. Sets `processing_status = 'uploaded'`
3. Enqueues background AI extraction job (if AI consent granted)
4. Creates audit log entry

---

### 9.2 List Reports

```
GET /v1/reports
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 50) |
| `family_member_id` | UUID | null | Filter by member |
| `report_type` | string | null | blood_test, thyroid, lipid, diabetes, etc. |
| `date_from` | date | null | Report date >= (YYYY-MM-DD) |
| `date_to` | date | null | Report date <= (YYYY-MM-DD) |
| `processing_status` | string | null | Filter by status |
| `search` | string | null | Search in title, lab name, doctor name |
| `sort_by` | string | `created_at` | created_at, report_date, report_title |
| `sort_order` | string | `desc` | asc, desc |
| `is_starred` | bool | null | Filter starred reports |

**Example:** `GET /v1/reports?family_member_id=fm-1111&report_type=blood_test&date_from=2026-01-01&sort_by=report_date&sort_order=desc&page=1&per_page=10`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6",
      "family_member_id": "fm-1111-2222-3333-444455556666",
      "family_member_name": "Rajesh Kumar",
      "report_type": "blood_test",
      "report_title": "Complete Blood Count",
      "report_date": "2026-06-18",
      "lab_name": "Apollo Diagnostics",
      "source": "pdf",
      "processing_status": "completed",
      "is_starred": false,
      "tags": [],
      "values_summary": {
        "total": 6,
        "normal": 2,
        "borderline": 2,
        "abnormal": 2
      },
      "thumbnail_url": "https://...signed-url...",
      "created_at": "2026-06-18T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total_items": 12,
    "total_pages": 2,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### 9.3 Get Report Detail

```
GET /v1/reports/{report_id}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6",
    "family_member_id": "fm-1111-2222-3333-444455556666",
    "family_member_name": "Rajesh Kumar",
    "report_type": "blood_test",
    "report_title": "Complete Blood Count",
    "report_date": "2026-06-18",
    "lab_name": "Apollo Diagnostics",
    "doctor_name": "Dr. Sharma",
    "notes": null,
    "source": "pdf",
    "processing_status": "completed",
    "ai_confidence_score": 92.5,
    "is_starred": false,
    "tags": [],
    "files": [
      {
        "id": "f1f2f3f4-f5f6-f7f8-f9f0-f1f2f3f4f5f6",
        "original_filename": "blood_test_report.pdf",
        "mime_type": "application/pdf",
        "page_number": 1,
        "download_url": "https://...signed-url-15min..."
      }
    ],
    "metadata": {
      "detected_report_type": "blood_test",
      "detected_lab_name": "Apollo Diagnostics",
      "detected_report_date": "2026-06-18",
      "extraction_engine": "gpt4_vision",
      "extraction_duration_ms": 12400,
      "page_count": 1
    },
    "extracted_values": [
      {
        "id": "ev-0001",
        "parameter_name": "Hemoglobin",
        "value": "14.2",
        "unit": "g/dL",
        "reference_range_low": 13.0,
        "reference_range_high": 17.0,
        "reference_range_text": "13.0–17.0",
        "status": "normal",
        "is_user_verified": true,
        "is_user_edited": false,
        "confidence_score": 98.5,
        "display_order": 1
      },
      {
        "id": "ev-0002",
        "parameter_name": "Fasting Blood Sugar",
        "value": "142",
        "unit": "mg/dL",
        "reference_range_low": 70.0,
        "reference_range_high": 110.0,
        "reference_range_text": "70–110",
        "status": "high",
        "is_user_verified": true,
        "is_user_edited": false,
        "confidence_score": 95.0,
        "display_order": 2
      },
      {
        "id": "ev-0003",
        "parameter_name": "HbA1c",
        "value": "7.1",
        "unit": "%",
        "reference_range_low": 4.0,
        "reference_range_high": 5.7,
        "reference_range_text": "<5.7",
        "status": "high",
        "is_user_verified": true,
        "is_user_edited": false,
        "confidence_score": 97.0,
        "display_order": 3
      }
    ],
    "created_at": "2026-06-18T14:30:00Z",
    "updated_at": "2026-06-18T14:35:00Z"
  }
}
```

---

### 9.4 Update Report

```
PATCH /v1/reports/{report_id}
```

**Request (partial):**
```json
{
  "report_type": "blood_test",
  "report_title": "Complete Blood Count (CBC)",
  "report_date": "2026-06-18",
  "lab_name": "Apollo Diagnostics",
  "doctor_name": "Dr. Sharma",
  "notes": "Annual checkup",
  "is_starred": true,
  "tags": ["annual", "important"]
}
```

**Response (200):** Updated report object.

---

### 9.5 Delete Report

```
DELETE /v1/reports/{report_id}
```

Soft deletes the report and associated files/values.

**Response (204):** No content.

---

### 9.6 Update Extracted Value

```
PATCH /v1/reports/{report_id}/values/{value_id}
```

**Request:**
```json
{
  "value": "13.8"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ev-0001",
    "parameter_name": "Hemoglobin",
    "value": "13.8",
    "original_ai_value": "14.2",
    "is_user_edited": true,
    "is_user_verified": true,
    "status": "normal"
  },
  "message": "Value updated"
}
```

Automatically sets `is_user_edited = true`, stores `original_ai_value`, recalculates `status`.

---

### 9.7 Confirm Report Review

```
POST /v1/reports/{report_id}/confirm
```

Sets `processing_status = 'completed'` and `is_user_verified = true` on all values.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6",
    "processing_status": "completed"
  },
  "message": "Report confirmed and saved"
}
```

---

### 9.8 Get Parameter Trends (Analytics)

```
GET /v1/reports/trends/{parameter_name}
```

**Query Params:**

| Param | Type | Default |
|-------|------|---------|
| `family_member_id` | UUID | default member |
| `months` | int | 6 |

**Example:** `GET /v1/reports/trends/HbA1c?family_member_id=fm-1111&months=12`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "parameter_name": "HbA1c",
    "unit": "%",
    "reference_range_low": 4.0,
    "reference_range_high": 5.7,
    "trend_direction": "increasing",
    "latest_value": "7.1",
    "latest_status": "high",
    "data_points": [
      { "date": "2026-01-15", "value": "6.5", "status": "high", "report_id": "r-aaa" },
      { "date": "2026-02-20", "value": "6.8", "status": "high", "report_id": "r-bbb" },
      { "date": "2026-03-18", "value": "6.4", "status": "high", "report_id": "r-ccc" },
      { "date": "2026-04-22", "value": "6.7", "status": "high", "report_id": "r-ddd" },
      { "date": "2026-05-10", "value": "6.9", "status": "high", "report_id": "r-eee" },
      { "date": "2026-06-18", "value": "7.1", "status": "high", "report_id": "r-fff" }
    ]
  }
}
```

---

### 9.9 Get Health Summary (Dashboard)

```
GET /v1/reports/health-summary
```

**Query:** `?family_member_id=fm-1111` (optional, defaults to active member)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "family_member_id": "fm-1111-2222-3333-444455556666",
    "family_member_name": "Rajesh Kumar",
    "total_reports": 12,
    "values_needing_attention": 2,
    "latest_report_date": "2026-06-18",
    "attention_items": [
      {
        "parameter_name": "HbA1c",
        "value": "7.1",
        "unit": "%",
        "status": "high",
        "reference_range_text": "<5.7",
        "report_date": "2026-06-18",
        "report_id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6"
      },
      {
        "parameter_name": "Vitamin D",
        "value": "18",
        "unit": "ng/mL",
        "status": "low",
        "reference_range_text": "30–100",
        "report_date": "2026-06-18",
        "report_id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6"
      }
    ],
    "recent_reports": [
      {
        "id": "r1r2r3r4",
        "report_title": "Complete Blood Count",
        "report_date": "2026-06-18",
        "lab_name": "Apollo Diagnostics",
        "report_type": "blood_test"
      }
    ]
  }
}
```

---

## 10. AI Extraction API

### 10.1 Trigger Extraction (Internal/Webhook)

```
POST /v1/reports/{report_id}/extract
```
**Auth:** Required. Also called internally after report creation.

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "report_id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6",
    "processing_status": "processing",
    "estimated_duration_seconds": 15
  },
  "message": "AI extraction started"
}
```

---

### 10.2 Get Processing Status (Polling)

```
GET /v1/reports/{report_id}/status
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report_id": "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6",
    "processing_status": "review_pending",
    "progress_percent": 100,
    "steps": [
      { "name": "document_scanned", "status": "completed" },
      { "name": "text_extracted", "status": "completed" },
      { "name": "values_found", "status": "completed" },
      { "name": "data_organized", "status": "completed" }
    ],
    "values_found": 6,
    "ai_confidence_score": 92.5
  }
}
```

Client polls this endpoint every 2–3 seconds during the AI Processing screen.

---

### 10.3 Reprocess Report

```
POST /v1/reports/{report_id}/reprocess
```

Re-runs AI extraction. Clears old extracted values.

**Response (202):** Same as trigger extraction.

---

## 11. Doctor Sharing API

**Auth:** Required.

### 11.1 Create Share Link

```
POST /v1/share-links
```

**Request:**
```json
{
  "report_ids": [
    "r1r2r3r4-r5r6-r7r8-r9r0-r1r2r3r4r5r6",
    "r2r3r4r5-r6r7-r8r9-r0r1-r2r3r4r5r6r7"
  ],
  "expires_in": "7d",
  "doctor_name": "Dr. Mehra",
  "hospital_name": "Apollo Hospital",
  "password": null
}
```

**`expires_in` values:** `24h`, `7d`, `30d`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "sl-1111-2222-3333-444455556666",
    "share_url": "https://medivault.app/s/xK9mP2qR7tY4wZ",
    "share_token": "xK9mP2qR7tY4wZ",
    "expires_at": "2026-06-28T10:00:00Z",
    "is_password_protected": false,
    "report_count": 2,
    "doctor_name": "Dr. Mehra",
    "hospital_name": "Apollo Hospital"
  },
  "message": "Secure share link created"
}
```

---

### 11.2 List Share Links

```
GET /v1/share-links
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "sl-1111-2222-3333-444455556666",
      "share_token": "xK9mP2qR7tY4wZ",
      "doctor_name": "Dr. Mehra",
      "hospital_name": "Apollo Hospital",
      "report_count": 2,
      "expires_at": "2026-06-28T10:00:00Z",
      "is_expired": false,
      "is_revoked": false,
      "view_count": 3,
      "created_at": "2026-06-21T10:00:00Z"
    }
  ]
}
```

---

### 11.3 Revoke Share Link

```
DELETE /v1/share-links/{link_id}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Share link revoked"
}
```

---

### 11.4 View Shared Reports (Public — No Auth)

```
GET /v1/shared/{share_token}
```

**Query:** `?password=abc123` (if password-protected)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "shared_by": "R. Kumar",
    "doctor_name": "Dr. Mehra",
    "expires_at": "2026-06-28T10:00:00Z",
    "reports": [
      {
        "report_title": "Complete Blood Count",
        "report_date": "2026-06-18",
        "lab_name": "Apollo Diagnostics",
        "extracted_values": [
          {
            "parameter_name": "Hemoglobin",
            "value": "14.2",
            "unit": "g/dL",
            "status": "normal",
            "reference_range_text": "13.0–17.0"
          }
        ],
        "file_urls": [
          {
            "download_url": "https://...signed-url-15min...",
            "mime_type": "application/pdf"
          }
        ]
      }
    ]
  }
}
```

**Error (410 — expired):**
```json
{
  "success": false,
  "error": {
    "code": "SHARE_LINK_EXPIRED",
    "message": "This share link has expired"
  }
}
```

**Error (403 — password required):**
```json
{
  "success": false,
  "error": {
    "code": "SHARE_PASSWORD_REQUIRED",
    "message": "This link requires a password"
  }
}
```

---

## 12. Consent Logs API

**Auth:** Required.

### 12.1 Grant Consent

```
POST /v1/consents
```

**Request:**
```json
{
  "consent_type": "ai_processing",
  "consent_version": "1.0",
  "is_granted": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "cl-1111-2222-3333-444455556666",
    "consent_type": "ai_processing",
    "consent_version": "1.0",
    "is_granted": true,
    "granted_at": "2026-06-21T10:00:00Z"
  },
  "message": "Consent recorded"
}
```

---

### 12.2 Get Consent Status

```
GET /v1/consents
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "consent_type": "ai_processing",
      "consent_version": "1.0",
      "is_granted": true,
      "granted_at": "2026-06-21T10:00:00Z",
      "revoked_at": null
    },
    {
      "consent_type": "terms_of_service",
      "consent_version": "1.0",
      "is_granted": true,
      "granted_at": "2026-06-21T10:00:00Z",
      "revoked_at": null
    }
  ]
}
```

---

### 12.3 Revoke Consent

```
POST /v1/consents/revoke
```

**Request:**
```json
{
  "consent_type": "ai_processing"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "AI processing consent revoked. New reports will not be auto-processed."
}
```

---

## 13. Audit Log Strategy

### What Gets Logged

| Action | Trigger | Details Captured |
|--------|---------|------------------|
| `user.register` | OTP verify (new user) | phone, ip |
| `user.login` | OTP verify (existing) | phone, ip, device |
| `user.logout` | Logout endpoint | token_id |
| `profile.update` | PATCH /profile | changed fields (before/after) |
| `family_member.create` | POST /family-members | member_id, name |
| `family_member.delete` | DELETE /family-members | member_id |
| `report.upload` | POST /reports | report_id, file_count, source |
| `report.update` | PATCH /reports | changed fields |
| `report.delete` | DELETE /reports | report_id |
| `file.upload` | File confirm | file_id, size, type |
| `file.download` | GET file URL | file_id, requester |
| `share_link.create` | POST /share-links | link_id, report_count, expiry |
| `share_link.view` | GET /shared/{token} | ip, user_agent |
| `share_link.revoke` | DELETE /share-links | link_id |
| `consent.grant` | POST /consents | type, version |
| `consent.revoke` | POST /consents/revoke | type |
| `extraction.start` | AI job starts | report_id, engine |
| `extraction.complete` | AI job finishes | report_id, values_count, duration |
| `value.edit` | PATCH /values | value_id, old_value, new_value |

### Implementation

```python
# FastAPI middleware approach
async def log_audit(
    user_id: UUID | None,
    action: str,
    resource_type: str,
    resource_id: UUID | None,
    details: dict | None,
    request: Request
):
    await db.execute(
        """INSERT INTO audit_logs
           (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)""",
        user_id, action, resource_type, resource_id,
        json.dumps(details), request.client.host,
        request.headers.get("user-agent")
    )
```

### Retention
- Active audit logs: 1 year in PostgreSQL
- Archived: Move to cold storage (S3 Glacier) after 1 year
- Legal retention: 7 years per healthcare compliance

---

## 14. Pagination, Search & Filter

### Pagination Strategy: Offset-based

Used for all list endpoints. Cursor-based pagination deferred to Phase 2 for infinite scroll.

```
GET /v1/reports?page=2&per_page=20
```

**Rules:**
- `page` starts at 1 (not 0)
- `per_page` default: 20, max: 50
- Response includes `pagination` object with `total_items`, `total_pages`, `has_next`, `has_prev`

### Search Strategy

Text search uses PostgreSQL `ILIKE` for Phase 1. Full-text search (`tsvector`) deferred to Phase 2.

```sql
-- Report search query pattern
WHERE deleted_at IS NULL
  AND user_id = $1
  AND (report_title ILIKE '%search%'
       OR lab_name ILIKE '%search%'
       OR doctor_name ILIKE '%search%')
```

### Filter Strategy

Filters are additive (AND logic). Applied via query parameters.

```sql
-- Composite filter example
WHERE deleted_at IS NULL
  AND user_id = $1
  AND ($2::uuid IS NULL OR family_member_id = $2)
  AND ($3::varchar IS NULL OR report_type = $3)
  AND ($4::date IS NULL OR report_date >= $4)
  AND ($5::date IS NULL OR report_date <= $5)
  AND ($6::varchar IS NULL OR processing_status = $6)
ORDER BY
  CASE WHEN $7 = 'report_date' THEN report_date END DESC,
  CASE WHEN $7 = 'report_title' THEN report_title END ASC,
  created_at DESC
LIMIT $8 OFFSET $9
```

---

## 15. Error Handling

### FastAPI Exception Handler Pattern

```python
from fastapi import HTTPException
from pydantic import BaseModel

class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: list = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []

class ErrorResponse(BaseModel):
    success: bool = False
    error: dict

@app.exception_handler(AppError)
async def app_error_handler(request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )

# Usage in route
raise AppError(
    code="REPORT_NOT_FOUND",
    message="Report not found or access denied",
    status_code=404
)
```

### Validation Error (Pydantic)

FastAPI auto-returns 422 for validation. Override to return 400:

```python
@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc):
    errors = [
        {"field": e["loc"][-1], "message": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors
            }
        }
    )
```

---

## 16. Implementation Notes

### FastAPI Project Structure

```
medivault-api/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app, middleware, exception handlers
│   ├── config.py                # Settings (env vars, secrets)
│   ├── database.py              # DB connection pool (asyncpg)
│   ├── dependencies.py          # get_current_user, get_db, etc.
│   │
│   ├── models/                  # SQLAlchemy / Pydantic models
│   │   ├── user.py
│   │   ├── profile.py
│   │   ├── family_member.py
│   │   ├── report.py
│   │   ├── file.py
│   │   ├── extracted_value.py
│   │   ├── share_link.py
│   │   ├── consent.py
│   │   └── audit.py
│   │
│   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── family_member.py
│   │   ├── report.py
│   │   ├── file.py
│   │   ├── share.py
│   │   └── consent.py
│   │
│   ├── routers/                 # API route handlers
│   │   ├── auth.py              # /v1/auth/*
│   │   ├── profile.py           # /v1/profile
│   │   ├── family_members.py    # /v1/family-members
│   │   ├── files.py             # /v1/files/*
│   │   ├── reports.py           # /v1/reports/*
│   │   ├── share.py             # /v1/share-links, /v1/shared/*
│   │   └── consents.py          # /v1/consents
│   │
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── otp_service.py       # Redis OTP management
│   │   ├── storage_service.py   # S3/GCS signed URLs
│   │   ├── extraction_service.py
│   │   └── audit_service.py
│   │
│   ├── middleware/
│   │   ├── auth.py              # JWT verification
│   │   ├── rate_limit.py
│   │   └── cors.py
│   │
│   └── utils/
│       ├── security.py          # JWT encode/decode, hashing
│       ├── pagination.py        # Paginate helper
│       └── validators.py        # Phone, file type validators
│
├── migrations/                  # Alembic migrations
│   └── versions/
├── tests/
├── alembic.ini
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/medivault

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=<random-256-bit-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Storage
STORAGE_PROVIDER=s3           # s3 or gcs
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_S3_BUCKET=medivault-uploads
AWS_S3_REGION=ap-south-1

# SMS (OTP)
SMS_PROVIDER=twilio           # twilio or msg91
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+1234567890

# App
APP_ENV=development
APP_URL=https://api.medivault.app
CORS_ORIGINS=https://medivault.app,http://localhost:3000
```

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/otp/send` | 3 requests | per phone per 15 min |
| `POST /auth/otp/verify` | 5 attempts | per phone per 15 min |
| `POST /files/upload-url` | 20 requests | per user per hour |
| All authenticated endpoints | 100 requests | per user per minute |
| `GET /shared/{token}` | 30 requests | per IP per hour |

### Security Checklist

- [ ] All file URLs are signed with 15-min expiry — never public
- [ ] Passwords hashed with bcrypt (share links)
- [ ] JWT tokens use HS256, secret rotated quarterly
- [ ] Refresh token rotation on every use
- [ ] OTP stored in Redis with 5-min TTL, max 5 attempts
- [ ] SQL parameterized queries only — no string concatenation
- [ ] CORS restricted to known origins
- [ ] Request body size limit: 1 MB (except file upload)
- [ ] Input validation on all endpoints via Pydantic
- [ ] Soft delete with `deleted_at` — data recoverable for 30 days
- [ ] Audit log immutable — no UPDATE/DELETE allowed
- [ ] User can only access own data — `user_id` check on every query

---

## Complete API Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **Auth** | | | |
| POST | `/v1/auth/otp/send` | No | Send OTP to phone |
| POST | `/v1/auth/otp/verify` | No | Verify OTP, get tokens |
| POST | `/v1/auth/google` | No | Google OAuth login |
| POST | `/v1/auth/token/refresh` | No | Refresh access token |
| POST | `/v1/auth/logout` | Yes | Revoke refresh token |
| **Profile** | | | |
| POST | `/v1/profile` | Yes | Create user profile |
| GET | `/v1/profile` | Yes | Get own profile |
| PATCH | `/v1/profile` | Yes | Update profile |
| **Family** | | | |
| GET | `/v1/family-members` | Yes | List all members |
| POST | `/v1/family-members` | Yes | Add member |
| PATCH | `/v1/family-members/{id}` | Yes | Update member |
| DELETE | `/v1/family-members/{id}` | Yes | Soft-delete member |
| PATCH | `/v1/family-members/{id}/set-default` | Yes | Set active member |
| **Files** | | | |
| POST | `/v1/files/upload-url` | Yes | Get presigned upload URL |
| POST | `/v1/files/{id}/confirm` | Yes | Confirm upload completed |
| GET | `/v1/files/{id}/url` | Yes | Get signed download URL |
| **Reports** | | | |
| POST | `/v1/reports` | Yes | Create report |
| GET | `/v1/reports` | Yes | List reports (filtered) |
| GET | `/v1/reports/{id}` | Yes | Report detail with values |
| PATCH | `/v1/reports/{id}` | Yes | Update report metadata |
| DELETE | `/v1/reports/{id}` | Yes | Soft-delete report |
| PATCH | `/v1/reports/{id}/values/{vid}` | Yes | Edit extracted value |
| POST | `/v1/reports/{id}/confirm` | Yes | Confirm review |
| POST | `/v1/reports/{id}/extract` | Yes | Trigger AI extraction |
| GET | `/v1/reports/{id}/status` | Yes | Get processing status |
| POST | `/v1/reports/{id}/reprocess` | Yes | Re-run extraction |
| GET | `/v1/reports/trends/{param}` | Yes | Parameter trend data |
| GET | `/v1/reports/health-summary` | Yes | Dashboard summary |
| **Sharing** | | | |
| POST | `/v1/share-links` | Yes | Create share link |
| GET | `/v1/share-links` | Yes | List my share links |
| DELETE | `/v1/share-links/{id}` | Yes | Revoke share link |
| GET | `/v1/shared/{token}` | No | View shared reports |
| **Consent** | | | |
| POST | `/v1/consents` | Yes | Grant consent |
| GET | `/v1/consents` | Yes | Get consent status |
| POST | `/v1/consents/revoke` | Yes | Revoke consent |

**Total: 30 endpoints**

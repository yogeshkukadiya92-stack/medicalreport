# MediVault API

Backend for the MediVault medical-report app. Built with **FastAPI + SQLAlchemy**,
deployable on **Railway** with PostgreSQL.

## Features

- Phone OTP auth (dev mode — no SMS gateway needed) with JWT
- User profiles (auto-creates a `self` family member)
- Family members (CRUD, set-default, max 10)
- Medical reports (CRUD, filter/search/sort/paginate)
- Extracted lab values + health summary + parameter trends
- Consent logs
- File metadata endpoints (storage stubbed — wire S3/GCS later)
- Standard response envelope: `{ success, data, message }` / `{ success, error }`

## Local Development

```bash
cd medivault-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Runs on SQLite if DATABASE_URL is empty
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health:   http://localhost:8000/health
- Base URL the frontend uses: `http://localhost:8000/v1`

### Dev login flow

1. `POST /v1/auth/otp/send` with `{ "phone": "+919876543210" }`
   → returns `dev_otp` in the response (dev mode)
2. `POST /v1/auth/otp/verify` with `{ "phone": "...", "otp": "123456" }`
   → returns `access_token`

The default dev OTP is **`123456`** and is always accepted in dev mode.

## Railway Deployment

1. New service → Deploy from GitHub → this repo
2. **Settings → Root Directory:** `medivault-api`
3. Add a **PostgreSQL** plugin to the project
4. Set environment variables (see `.env.example`):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Reference) |
| `JWT_SECRET_KEY` | long random string (`openssl rand -hex 32`) |
| `OTP_MODE` | `dev` (until an SMS gateway is wired) |
| `CORS_ORIGINS` | your frontend URL, e.g. `https://medivault-web.up.railway.app` |
| `ENVIRONMENT` | `production` |

`PORT` is provided automatically by Railway.

## Production TODO

- Real SMS gateway for OTP (`OTP_MODE=prod`)
- S3/GCS object storage + presigned URLs in `routers/files.py`
- Alembic migrations instead of `create_all`
- Rate limiting + refresh-token rotation

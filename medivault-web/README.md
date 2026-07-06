# MediVault Web

MediVault is a Next.js medical report vault with Supabase Auth, MongoDB persistence, GridFS original file storage, AI-assisted self uploads, and a structured medical lab dashboard.

## Current Production Features

- Client app for family members, uploads, report history, dashboard, and analytics.
- Supabase email/password and magic-link authentication.
- MongoDB-backed cloud vault sync.
- Original PDF/image file storage through MongoDB GridFS.
- AI analysis for client self-uploaded reports when an AI provider key is configured.
- Lab portal under `/lab` for clients, templates, structured report creation, report history, settings, work queue, critical alerts, and client app sync status.
- Lab reports are manual/structured and do not use AI.

## Local Development

```bash
cd medivault-web
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Local development can run without Supabase, but production needs Supabase public variables so protected app screens can authenticate real users.

## Required Environment Variables

Set these in Railway before deploying:

```bash
NEXT_PUBLIC_APP_NAME=MediVault
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=medivault
```

Optional AI analysis variables:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
NVIDIA_API_KEY=nvapi-your-nvidia-api-key
NVIDIA_MODEL=meta/llama-3.2-11b-vision-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com
```

MediVault reads Supabase public config at runtime from `/api/public-config`. After changing Railway variables, let Railway redeploy or restart the service so the runtime process sees the new values.

## Production Checks

```bash
npm run build
```

Post-deploy smoke checks:

- `/login` lets a Supabase user sign in.
- `/dashboard` redirects unauthenticated users to login.
- `/upload` stores the original file and saves the report to the cloud vault.
- `/reports` shows self-uploaded reports and lab-published reports after phone match.
- `/lab` loads Today Work Queue, Critical Alerts, Client App Sync, KPIs, and recent reports for a signed-in lab user.
- `/lab/create` can create a structured report and publish it without AI.

## Railway Notes

- Build command: `npm run build`
- Start command: `npm start`
- Runtime: Node.js 20+
- Public domain: configure on the Railway service settings.
- Required services: MongoDB plus the web service. Postgres is not required for the current app runtime.

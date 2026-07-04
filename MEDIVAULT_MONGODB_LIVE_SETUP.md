# MediVault MongoDB Live Setup

MediVault now supports MongoDB persistence for the web app vault data.

## What MongoDB Saves

Collection: `vaults`

Each signed-in Supabase user gets one document:

```json
{
  "userId": "supabase-user-id",
  "snapshot": {
    "activeMemberId": "member-id",
    "familyMembers": [],
    "reports": []
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

Original uploaded PDFs/images are stored separately in MongoDB GridFS:

- Bucket: `reportFiles`
- Metadata owner field: `metadata.userId`
- Report metadata stores: `fileId`, `fileMimeType`, `fileSizeBytes`

The browser still keeps `localStorage` as an instant/offline fallback, but after login the app loads and saves the vault through `/api/vault`. Original files require MongoDB and signed-in Supabase auth.

## Required Live Variables

Add these in Railway/Vercel/hosting variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=medivault
```

For AI report extraction, also add:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
```

## MongoDB Atlas Steps

1. Create a MongoDB Atlas cluster.
2. Create a database user with read/write permission.
3. Add your deployment server IP to Network Access, or use `0.0.0.0/0` only for early testing.
4. Copy the Node.js connection string into `MONGODB_URI`.
5. Keep `MONGODB_DB=medivault` unless you want another database name.

## Security Notes

- `/api/vault` requires a Supabase access token.
- The API verifies the token server-side using Supabase before reading/writing MongoDB.
- MongoDB data is separated by `userId`.
- Do not expose `MONGODB_URI` with `NEXT_PUBLIC_`; it must stay server-only.

## Verify

```bash
cd medivault-web
npm run build
npm run dev
```

Then:

1. Sign in.
2. Add a family member.
3. Upload or manually add a report.
4. Check MongoDB Atlas collection `medivault.vaults`.
5. For uploaded PDFs/images, check GridFS collections `medivault.reportFiles.files` and `medivault.reportFiles.chunks`.
6. Open the report details screen and use `View original file`.

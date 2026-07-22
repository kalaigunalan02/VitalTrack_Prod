# VitalTrack — Health Monitor

React + TypeScript + Vite + Tailwind. Cloud-backed by Supabase, with a
localStorage fallback so it runs before cloud keys are configured.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173 (uses .env.development)
npm run build    # production build (uses .env.production)
```

Until you add Supabase keys (see below), the app runs on the **localStorage
fallback** — fully usable for one device, no cloud sync.

## Environments

| Mode | Env file | Supabase project | Selected by |
|---|---|---|---|
| Development | `.env.development` | `VitalTrack_Dev` | `npm run dev` |
| Production | `.env.production` | `VitalTrack_Prod` | `npm run build` |

Vite loads the matching file automatically by mode — no code branching.

A `[Dev]` badge appears next to the logo in development only.

### Configure keys

1. Copy `.env.example` → `.env.development` and `.env.production` (already exist with placeholders).
2. In each Supabase project: **Project Settings → API** → copy **Project URL** and **anon public key**.
3. Paste them into the matching env file. Leave blank to stay on the localStorage fallback.

```bash
# .env.development
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://<dev-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<dev-anon-key>

# .env.production
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://<prod-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon-key>
```

**Never commit the filled-in env files** — they are git-ignored. `.env.example`
is the committed template.

## Database setup

Run `supabase/schema.sql` in the **SQL Editor** of **each** Supabase project
(Dev and Prod). It creates the `profiles` + `health_records` tables, RLS
policies (users only see their own rows), and a trigger that auto-creates a
default profile on signup.

For the **Dev** project only, also create the demo/guest account so
"Continue as Guest" works:
1. Dashboard → **Authentication → Users → Add user**: `demo@example.com` / `demo1234`.
2. Run the commented seed block at the bottom of `schema.sql`.

### Supabase Auth redirect URLs

- **Dev project:** `http://localhost:5173`, `https://<vercel-dev-url>`
- **Prod project:** `https://<vercel-prod-url>`

(Authentication → URL Configuration → Redirect URLs)

## Architecture

```
React app
  └─ src/lib/storage.ts   ← single data-layer interface (auth + profiles + records)
       ├─ Supabase path   (when VITE_SUPABASE_URL + key are set)
       └─ localStorage     (fallback otherwise)
```

`storage.ts` exposes one set of async functions (`signIn`, `listRecords`,
`addRecord`, …). The rest of the app (contexts, pages) calls only those — it
never branches on the backend. Switching from local to cloud is purely an env
change.

## Deployment workflow (Dev → Prod)

Two GitHub repos, two Vercel projects, two Supabase projects — fully isolated.

```
Developer → VitalTrack_Dev (GitHub) → Vercel Dev → Supabase VitalTrack_Dev
                                              ↓ (after final testing)
              VitalTrack_Prod (GitHub) → Vercel Prod → Supabase VitalTrack_Prod
```

### One-time setup

1. **GitHub:** add the two repos as remotes.
   ```bash
   git remote add dev   git@github.com:<you>/VitalTrack_Dev.git
   git remote add prod  git@github.com:<you>/VitalTrack_Prod.git
   ```
2. **Vercel:** create two projects importing the two GitHub repos.
   - Dev project: set env vars from `.env.development`; deploy branch = `main` (or `dev`).
   - Prod project: set env vars from `.env.production`; deploy branch = `main`.
3. **Supabase:** run `schema.sql` in both projects; set redirect URLs (above).

### Ongoing flow

1. Develop and push to `VitalTrack_Dev`.
2. Vercel auto-deploys the Dev preview; test there.
3. When stable, push the same commit to `VitalTrack_Prod`.
4. Vercel auto-deploys Production.

## Database safety

- Dev and Prod use **different** Supabase projects with **different** keys.
- Never paste a Prod key into `.env.development` or vice-versa.
- RLS enforces isolation per user at the database level.

## Project structure

```
src/
  lib/
    supabase.ts        Supabase client + isSupabaseConfigured flag
    storage.ts         Data layer (Supabase + localStorage fallback)
    classification.ts  BP staging logic
    summary.ts         Journal summary text
    seed.ts            localStorage fallback seed data
  context/             Auth, Data, Analytics providers
  components/           layout, auth, charts, ui
  pages/                auth screens, Dashboard, AddRecord, History, Reports, Settings
supabase/
  schema.sql            Run in each Supabase project's SQL editor
```

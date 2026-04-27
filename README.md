# Life Tracking App

Atomic Habits-aligned goal and habit execution app built with Next.js App Router, TypeScript, and Supabase.

## Core Flows

- Goals with progress and pace projection messaging.
- Habits with cue/identity metadata, streak tracking, pause/resume, and per-habit heatmaps.
- Today dashboard for one-click daily execution.
- Calendar with quick complete/skip actions, never-miss-twice cueing, and context drawer.
- Analytics with leaderboard, weekly comparisons, day strength, heatmaps, and weekly review prompts.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open `http://localhost:3000`.

## Quality Gates

Run these before shipping:

```bash
npm run lint
npm run test
npm run build
```

## Database Schema Scripts

Canonical SQL lives in:

- `supabase/sql/drop_all_tables.sql`
- `supabase/sql/init.sql`
- `supabase/sql/auth_rls.sql`

`supabase/migrations/` is intentionally kept empty and reserved for future incremental schema updates.

Reset/setup flow:

```bash
psql "$DATABASE_URL" -f supabase/sql/drop_all_tables.sql
psql "$DATABASE_URL" -f supabase/sql/init.sql
psql "$DATABASE_URL" -f supabase/sql/auth_rls.sql
```

## Delivery Docs

Implementation acceptance and rollout details are documented in:

- `docs/implementation-prd.md`
- `docs/superpowers/plans/2026-04-21-atomic-habits-behavior-engine.md`

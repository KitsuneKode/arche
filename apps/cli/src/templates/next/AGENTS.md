# Next.js App

## Purpose

Standalone Next.js App Router app with env validation, App Router boundaries, and a deploy health check.

## Read First

- `env.ts` — `@t3-oss/env-nextjs` server/client env schema
- `app/layout.tsx` — root layout and global styles (`app/styles.css`)
- `app/page.tsx` — home page
- `app/api/health/route.ts` — ops/smoke health endpoint
- `next.config.js` — ESM Next config

## Owns

- App Router routes, layouts, and UI under `app/` and `components/`
- Client env (`NEXT_PUBLIC_*`) and server env via `env.ts`
- Error, loading, and not-found boundaries (`app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`)

## Commands

```bash
bun run dev          # next dev --turbopack
bun run build && bun run start   # production (smoke probes GET /api/health)
bun run check-types  # tsc --noEmit
bun run lint         # oxlint
```

Copy `.env.example` to `.env.local` before `dev` if env validation fails.

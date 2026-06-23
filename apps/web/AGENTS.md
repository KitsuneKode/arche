# Web App Notes

## Purpose

Next.js App Router frontend: runtime wiring + template showcase UI. Deploy on Vercel; `NEXT_PUBLIC_API_URL` may point to Path A (`*.vercel.app`), Path B (`*.onrender.com`), or Path C (`*.up.railway.app`).

- Production default: [docs/production-playbook.md](../../docs/production-playbook.md)
- Deploy hub: [docs/deployment.md](../../docs/deployment.md)
- Build: `bun run build --filter=@arche-template/web` (Vercel uses app root `apps/web`)

## Before push

Protected branches require full-monorepo CI — see [docs/ci.md](../../docs/ci.md). Web-only fast loop: format → `mdx:generate` (after content edits) → `turbo lint check-types --filter=@arche-template/web` → `bun test apps/web` → build. If shared packages changed, drop the filter or run full `bun run ci`.

## Read first

- [`../../PRODUCT.md`](../../PRODUCT.md) - product voice, truthful-claim rules, and accessibility bar
- [`.docs/product/web-brand-ui-brief.md`](../../.docs/product/web-brand-ui-brief.md) - public-site direction and current web work slices
- [`.docs/product/verification-matrix.md`](../../.docs/product/verification-matrix.md) - only source for public preset support claims
- `app/layout.tsx` — metadata (`metadataBase` from `NEXT_PUBLIC_SITE_URL`)
- `trpc/server.tsx` — `trpcCaller` for RSC; HTTP `trpc` proxy for client components
- `trpc/client.tsx` — browser client
- `components/providers.tsx` — theme only (no root `TRPCReactProvider`; use `trpc/client` when a route needs hooks)
- `env.ts`

## Data fetching (tRPC)

- **Server Components / server actions:** `const api = await trpcCaller()` then `api.<router>.<proc>()`. Uses `createCaller` in-process (session + Prisma)—no HTTP loopback to the API.
- **Client components:** hooks via `trpc` from `@/trpc/client` (HTTP to `NEXT_PUBLIC_API_URL`).
- **Prefetch + hydrate:** `prefetch()` + `HydrateClient` for client-bound queries.

## Owns

App Router pages, marketing/demo routes, providers, public assets. Public docs/blog/presets map: see `.docs/product/web-brand-ui-brief.md`.

## Template cleanup

If starting fresh: `app/demo`, `app/landing`, `components/demos`, `components/landing*`, `lib/demo-data.ts`.

## Update when

Routes, providers, tRPC wiring, or env names change.

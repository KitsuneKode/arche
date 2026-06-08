# Template Families

This document replaces the old variant matrix with the new family-first model.

## Families

1. `fullstack`
2. `next`
3. `backend`
4. `rust`
5. `solana`
6. `convex`
7. `worker`
8. `lib`
9. `cli`
10. `mobile`
11. `polyglot`

## Shared Rules

- `create` stays the root verb
- Families are the primary entrypoints
- Addons are named overlays, not loose booleans
- Package manager is chosen at the top level of the generated repo
- Smoke tests are required for supported families

## `fullstack`

The default TypeScript monorepo family.

- Core tree: `apps/web`, `apps/server`, `packages/*`
- Default bundle: `product`
- Optional extras: `worker`, `docs`, `examples`
- Addon groups: `product`, `realtime`, `growth`, `infra`, `AI`
- Web client: `@trpc/tanstack-react-query` + TanStack Query (`TRPCReactProvider` in layout)
- Databases: `postgres` and `sqlite` only (MongoDB removed)
- CI combo matrix: `bun toolings/scripts/verify-generated-project.ts --combo-matrix` covers default, `hono-bun`, `drizzle`, `sqlite`, `rust-axum`, and `--worker`

## `next`

Clean Next.js app family.

- Default: frontend-only
- Presets: `auth`, `docs`, `analytics`, `storage`

## `backend`

API-first service family.

- Default: API-only
- Default bundle: `product`

## `convex`

Next.js + Convex family. Prefer preset **`convex-product`** in the CLI menu.

- Default: Next.js + Convex functions, schema, Better Auth stubs
- No `apps/server`, Prisma, or tRPC monorepo
- Deploy: Vercel (web) + Convex Cloud — see generated `docs/deployment.md`
- When to choose: realtime queries, serverless backend, no SQL migrations

## `rust`

Rust service family.

- Module-first Axum API: `routes → handler → service → repository`
- SQLx migrations apply on startup when `DATABASE_URL` is set
- Presets: `rust-api` (standalone), `rust-fullstack` (Next.js + `services/api` with the same module tree)
- Docs: generated `README.md`; see [Rust book](https://doc.rust-lang.org/book/) and [Axum](https://docs.rs/axum/latest/axum/)

## `solana`

Solana + Anchor family (Anchor 0.32+).

- Presets: `solana-program`, `solana-web`, `solana-mobile`, `solana-product`
- Layout: `programs/core`, `packages/solana-config`, `packages/solana-client` (Anchor TS client), optional `apps/web` / `apps/mobile`
- Scripts: `anchor:build`, `anchor:test`; generated `docs/solana-getting-started.md`
- References: [Anchor book](https://book.anchor-lang.com/), [Solana docs](https://solana.com/docs)

## `worker`

Standalone worker family.

- Default: BullMQ + Redis
- Optional: Inngest

## `lib`

Generic package family.

- Default: TypeScript package
- Optional: shadcn/ui, Storybook

## `cli`

CLI package family.

- Default: TypeScript package
- Default release config and Changesets

## `mobile`

Expo family.

- Default: Expo Router + TypeScript
- Optional: auth, data, docs presets

## `polyglot`

Separate first-class family for mixed-language repos.

- Service-centric monorepo
- Rust + TS support service default
- Go and Python are advanced opt-ins
- Separate roots only

## Addon Bundles

### `product`

- auth
- DB
- API

### `realtime`

- WebSocket
- worker
- docs

### `growth`

- analytics
- feature flags
- A/B docs

### `infra`

- monitoring
- storage
- CI/deploy docs

### `AI`

- examples
- helpers
- docs

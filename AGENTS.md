# Agent guide (canonical)

Read this file first, then the **nearest** local `AGENTS.md` for the workspace you edit.

## How to navigate

1. Nearest `AGENTS.md` (app or package you touch).
2. [docs/README.md](docs/README.md) — public/manual documentation.
3. [`.docs/README.md`](.docs/README.md) and one task-specific internal topic when implementing.
4. One matching [`.plans/active/`](.plans/active/) plan when executing approved work.

Run `bun run repo:doctor` before release or after large cleanup passes.

## Repo-specific invariants

- tRPC: `apps/server/src/modules/<feature>/*.trpc.ts` → `apps/server/src/modules/trpc/app.router.ts`.
- tRPC contract: `apps/server/src/modules/trpc` exports `AppRouter` and `createCaller` directly to web/worker.
- Production default: Vercel web + Render Docker API + Neon + Upstash — [docs/production-playbook.md](docs/production-playbook.md).
- Prefer correctness and robustness over short-term convenience.

## Before push · Commands · Deploy

CI: `bun run ci:min` (full `bun run ci` on `main`/`prod`/`develop`) — [docs/ci.md](docs/ci.md). Commands: [docs/commands.md](docs/commands.md). Deploy: [docs/deployment.md](docs/deployment.md), env [docs/deployment-env.md](docs/deployment-env.md).

## Stack map

| Workspace                 | Role                                                   |
| ------------------------- | ------------------------------------------------------ |
| `apps/web`                | Next.js App Router; tRPC client + `trpcCaller` for RSC |
| `apps/server`             | Express, Better Auth, `src/modules/*`                  |
| `apps/worker`             | Background jobs (Redis/BullMQ when enabled)            |
| `packages/store`          | Prisma schema and client                               |
| `packages/auth`           | Better Auth server + client                            |
| `packages/backend-common` | `serverEnv`, Redis, BullMQ, logging, `validate-env`    |

## Do not load by default

[docs/archive/planning/](docs/archive/planning/) — historical only.

## Portfolio / CLI / brand

CLI: [apps/cli/CLI-SPEC.md](apps/cli/CLI-SPEC.md). Brand/web: [PRODUCT.md](PRODUCT.md), [`.docs/product/web-brand-ui-brief.md`](.docs/product/web-brand-ui-brief.md).

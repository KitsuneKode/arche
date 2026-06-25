# Environment variables (local)

Production matrix (all deploy targets): [deployment-env.md](./deployment-env.md).

## Split by workspace

| File                       | Workspace     | Purpose                                |
| -------------------------- | ------------- | -------------------------------------- |
| `apps/web/.env.example`    | Web (Next.js) | `NEXT_PUBLIC_*` URLs and site metadata |
| `apps/server/.env.example` | API (Express) | `DATABASE_URL`, auth, Redis, `PORT`    |

There is no single root `.env` — copy each example into `.env.local` (web) and `.env` (server).

## Local setup

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env
```

**Easiest path (Postgres only, no Redis):**

```bash
bun run dev:local
```

That starts Docker Postgres (`~/Projects/docker-compose/postgres/docker-compose.db.yml`), runs migrations, then web (`:3000`) + API (`:8080`).

| Script                   | What it does                                                            |
| ------------------------ | ----------------------------------------------------------------------- |
| `bun run dev:deps`       | Postgres container only                                                 |
| `bun run dev:deps:redis` | Postgres + Redis (`~/Projects/docker-compose/redis/docker-compose.yml`) |
| `bun run dev:app`        | Web + API (assumes Postgres is up)                                      |
| `bun run dev:local`      | deps → migrate → app                                                    |

Set `ENABLE_REDIS=false` in `apps/server/.env` for local play (default in `.env.example`). Turn Redis on only when you need queues/worker.

Override compose paths: `DOCKER_COMPOSE_POSTGRES`, `DOCKER_COMPOSE_REDIS`.

## Quick reference (development)

**Web** (`apps/web/.env.local`): `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`.

**Server** (`apps/server/.env`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FRONTEND_URL`, `ENABLE_REDIS`, `REDIS_URL`, `PORT`, `HOST`.

See `apps/server/.env.example` and `packages/backend-common/src/env.ts` for validation rules.

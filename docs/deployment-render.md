# Path B — Vercel web + Render API

Hub: [deployment.md](./deployment.md). Default ops: [production-playbook.md](./production-playbook.md). Env matrix: [deployment-env.md](./deployment-env.md).

`apps/web` on Vercel. `apps/server` on Render as **Docker**. **Postgres and Redis are external** (Neon + Upstash) — paste `DATABASE_URL` and `REDIS_URL` in the Render dashboard.

## Blueprint (recommended)

Root [`render.yaml`](../render.yaml) creates a Docker web service only (no Render Postgres or Key Value).

1. Stop or delete any old manual Native Bun service that conflicts.
2. **Dashboard → Blueprints → New Blueprint Instance** → connect repo.
3. After deploy, set **Environment** (sync: false in blueprint):
   - `DATABASE_URL` — Neon (or other Postgres URL)
   - `REDIS_URL` — Upstash (or `ENABLE_REDIS=false`)
   - `FRONTEND_URL` — Vercel web URL (**required**)
   - `BETTER_AUTH_URL` — `https://<arche-template-api>.onrender.com` (optional if unset: uses Render’s `RENDER_EXTERNAL_URL`)
   - `BETTER_AUTH_SECRET` — 32+ random chars (**dashboard only**; blueprint uses `sync: false`, not committed)
4. Migrate: `bun run db:migrate` with production `DATABASE_URL`.
5. Vercel web: `NEXT_PUBLIC_API_URL` = same API URL — [deployment-env.md](./deployment-env.md).

```bash
# Live smoke (120s timeout per request — cold start on free tier)
bun run test:deploy
bun run test:deploy:all   # Render + Vercel template URLs

# Another host
RENDER_API_URL=https://<your-service>.onrender.com bun run test:deploy

curl -sS "https://<your-service>.onrender.com/"
curl -sS "https://<your-service>.onrender.com/health"
```

Do **not** set `PORT` manually. Health check path: `/health`.

Docker uses `turbo prune @arche-template/server` in [apps/server/Dockerfile](../apps/server/Dockerfile). Test locally before pushing:

```bash
bun run docker:build
```

Bun matches [`.bun-version`](../.bun-version). Install uses `--ignore-scripts` (pruned `out/json/` has no `turbo.json`); `db:generate` runs after sources are copied. The builder stage **slims root `devDependencies`** (husky, changesets, sharp, etc. stay out of the image) via `toolings/scripts/docker-slim-pruned-root.ts` — only `turbo` + `typescript` remain at the root before `bun install`. Install is **not** `--frozen-lockfile` in Docker because the slimmed root `package.json` is a subset of the committed lockfile.

## Manual Docker service

Same env as the blueprint — [deployment-vercel.md](./deployment-vercel.md) server table:

| Setting      | Value                    |
| ------------ | ------------------------ |
| Runtime      | Docker                   |
| Dockerfile   | `apps/server/Dockerfile` |
| Context      | repo root `.`            |
| Health check | `/health`                |

## Optional worker

Deploy `apps/worker` as a second Render service with `REDIS_URL` (+ `DATABASE_URL` if jobs use Prisma). Not required for basic API + web.

## Troubleshooting

### Deploy fails after Relay Lattice / schema changes

Run migrations against production Postgres before expecting `/health` to stay up:

```bash
DATABASE_URL='postgresql://...' bun run db:migrate
DATABASE_URL='postgresql://...' bun run db:seed   # optional demo + lattice cells
```

### `Missing required: REDIS_URL`

1. Set `REDIS_URL` from Upstash (external).
2. Or `ENABLE_REDIS=false` (no queues, no `/admin/queues`).

Do **not** rely on Render Key Value for this template.

### `Redis connection failed` / exits after `listening`

Blueprint defaults to **`ENABLE_REDIS=false`** (API-only). If you see Redis errors right after listen:

1. **Dashboard → Environment** → set `ENABLE_REDIS=false` and redeploy (no Upstash needed for v1), **or**
2. Set a valid Upstash URL: `REDIS_URL=rediss://default:...@...upstash.io:6379` and `ENABLE_REDIS=true`.

A bad or placeholder `REDIS_URL` with `ENABLE_REDIS=true` crashes the process after bind.

Wrong start command for Native Bun (discouraged):

```bash
cd apps/server && HOST=0.0.0.0 bun run start
```

Not `bun run apps/server/dist/server.js` from repo root.

### "No open ports detected"

- Wrong start command or crash before `listen()` — see [server.ts](../apps/server/src/server.ts) (listen first, then Redis).
- Missing `DATABASE_URL` / `REDIS_URL` — check logs for `Environment validation failed`.
- Custom `PORT` in dashboard — remove; Render injects `PORT`.

### Manual Native Bun (discouraged vs Docker)

| Setting        | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Root directory | `.`                                                            |
| Build          | `bun install && bun run build --filter=@arche-template/server` |
| Start          | `cd apps/server && HOST=0.0.0.0 bun run start`                 |

Prefer Docker blueprint.

## Endpoints

| Path          | Purpose          |
| ------------- | ---------------- |
| `GET /`       | Service metadata |
| `GET /health` | Health (DB ping) |
| `/api/trpc`   | tRPC             |
| `/api/auth`   | Better Auth      |

## Related

- [apps/server/README.md](../apps/server/README.md)
- Path A (all Vercel): [deployment-vercel.md](./deployment-vercel.md)
- Path C (Railway API): [deployment-railway.md](./deployment-railway.md)

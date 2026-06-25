# Production playbook

Canonical default for **KitsuneKode** products built from this template. Path guides add platform clicks; this doc is the single operational checklist.

**Related:** [deployment.md](./deployment.md) (three paths), [deployment-env.md](./deployment-env.md) (variable matrix).

## Default stack

| Layer    | Service                                                       |
| -------- | ------------------------------------------------------------- |
| Web      | Vercel — `apps/web`                                           |
| API      | Render Docker — `apps/server` ([render.yaml](../render.yaml)) |
| Postgres | Neon — `DATABASE_URL` on API only                             |
| Redis    | Upstash — `REDIS_URL` on API (or disabled)                    |

Path B guide: [deployment-render.md](./deployment-render.md). Paths A and C: [deployment-vercel.md](./deployment-vercel.md), [deployment-railway.md](./deployment-railway.md).

Do **not** use Render Postgres or Render Key Value for this template.

## Migrations

**Who:** operator or CI job with access to production `DATABASE_URL`.

**When:** after Neon is provisioned and **before** or immediately after the first API deploy that serves traffic. Re-run on every schema change before relying on new code.

```bash
# From repo root; DATABASE_URL must point at the target database
export DATABASE_URL='postgresql://...'
bun run db:deploy
bun run db:seed
```

The API container does **not** run migrations on boot by default. Add a release-phase script only if you explicitly want that behavior.

## Auth and CORS checklist

Set on the **API** host only (unless Path A also deploys API on Vercel):

| Variable             | Must match                                        |
| -------------------- | ------------------------------------------------- |
| `FRONTEND_URL`       | Public web origin, e.g. `https://app.example.com` |
| `BETTER_AUTH_URL`    | Public API origin, e.g. `https://api.example.com` |
| `BETTER_AUTH_SECRET` | 32+ chars; same across API replicas               |

On **web** (Vercel):

| Variable              | Must match                       |
| --------------------- | -------------------------------- |
| `NEXT_PUBLIC_API_URL` | Same origin as `BETTER_AUTH_URL` |
| `NEXT_PUBLIC_APP_URL` | Same origin as `FRONTEND_URL`    |

Verify: sign-in, one authenticated tRPC call, no browser CORS errors. Trailing slashes: use origins **without** a trailing slash unless your host docs say otherwise.

## Worker (v1 stance)

| Mode                | `ENABLE_REDIS` | `REDIS_URL` | `apps/worker`        |
| ------------------- | -------------- | ----------- | -------------------- |
| API + web only      | `false`        | omit        | do not deploy        |
| Queues + Bull Board | `true`         | Upstash URL | optional 2nd service |

Path B: optional `apps/worker` on Render with the same `REDIS_URL` (and `DATABASE_URL` if jobs use Prisma). Not required for v1 launches.

## Staging

Use a **Neon branch** (or separate Neon project) for staging `DATABASE_URL`. Point a Vercel **Preview** project or branch deploy at staging API + staging DB. Keep `FRONTEND_URL` / `BETTER_AUTH_URL` aligned with the preview URLs you actually use.

## Rollout order

1. Neon + Upstash (or `ENABLE_REDIS=false`).
2. Deploy API (Render); set env from [deployment-env.md](./deployment-env.md).
3. `bun run db:migrate` against that `DATABASE_URL`.
4. `curl https://<api>/health`
5. Deploy web; set `NEXT_PUBLIC_API_URL`.
6. Smoke: sign-in + one tRPC mutation/query.

## Rollback one-liners

| Host                | Action                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Vercel web          | Dashboard → Deployments → previous deployment → **Promote to Production**                    |
| Vercel API (Path A) | Same on the **server** Vercel project                                                        |
| Render API          | Dashboard → service → **Manual Deploy** → select previous image/commit                       |
| Railway API         | Service → Deployments → rollback to previous deployment                                      |
| Database            | Neon: restore branch / point-in-time; re-run migrations only if schema rolled back with code |

After API rollback, confirm `BETTER_AUTH_URL` and `NEXT_PUBLIC_API_URL` still match the live API origin.

## When to deviate

| Need                       | Consider                                                  |
| -------------------------- | --------------------------------------------------------- |
| All-in on Vercel           | Path A — [deployment-vercel.md](./deployment-vercel.md)   |
| Prefer Railway over Render | Path C — [deployment-railway.md](./deployment-railway.md) |
| No background jobs         | `ENABLE_REDIS=false`, skip worker                         |

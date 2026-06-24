# Production environment matrix

Canonical list for deploy targets. Hub: [deployment.md](./deployment.md). Operational checklist: [production-playbook.md](./production-playbook.md).

Legend: **R** = required, **O** = optional, **—** = do not set, **auto** = platform sets.

| Variable                       | Web (Vercel)        | API (Vercel)       | API (Render)           | API (Railway)           | Worker (Render/Railway) |
| ------------------------------ | ------------------- | ------------------ | ---------------------- | ----------------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL`          | R                   | —                  | —                      | —                       | —                       |
| `NEXT_PUBLIC_API_URL`          | R                   | —                  | —                      | —                       | —                       |
| `API_UPSTREAM_URL`             | O (server-only)     | —                  | —                      | —                       | —                       |
| `NEXT_PUBLIC_SITE_URL`         | O                   | —                  | —                      | —                       | —                       |
| `NEXT_PUBLIC_SITE_NAME`        | O                   | —                  | —                      | —                       | —                       |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | O                   | —                  | —                      | —                       | —                       |
| `DATABASE_URL`                 | —                   | R                  | R                      | R                       | R if jobs use Prisma    |
| `REDIS_URL`                    | —                   | R if queues        | R if queues            | R if queues             | R                       |
| `ENABLE_REDIS`                 | —                   | O (default `true`) | O (default `true`)     | O (default `true`)      | —                       |
| `BETTER_AUTH_SECRET`           | —                   | R (32+ chars)      | R                      | R                       | —                       |
| `BETTER_AUTH_URL`              | —                   | R (public API URL) | R                      | R                       | —                       |
| `FRONTEND_URL`                 | —                   | R (web URL)        | R                      | R                       | —                       |
| `NODE_ENV`                     | auto / `production` | `production`       | `production`           | `production`            | `production`            |
| `HOST`                         | —                   | —                  | R (`0.0.0.0`)          | R (`0.0.0.0`)           | —                       |
| `PORT`                         | —                   | —                  | **—** (Render injects) | **—** (Railway injects) | —                       |
| `RENDER`                       | —                   | —                  | auto                   | —                       | O on Render             |
| `VERCEL`                       | auto on web         | auto on API        | —                      | —                       | —                       |

## Notes

- **Postgres / Redis:** always external URLs (Neon + Upstash recommended). Do not use Render-managed Postgres or Key Value for this template.
- **Web project** must not receive `DATABASE_URL` or `BETTER_AUTH_SECRET` unless you also deploy the API on Vercel (Path A puts secrets on the **server** project only).
- **`NEXT_PUBLIC_API_URL`** — public API origin seen by the browser. With same-origin proxy, set equal to `NEXT_PUBLIC_APP_URL`; set **`API_UPSTREAM_URL`** (web project only) to the real API host.
- **`API_UPSTREAM_URL`** — optional on Vercel web. Enables Next.js rewrites of `/api/*` and `/health` to the upstream API. Omit locally when `NEXT_PUBLIC_API_URL` points at `localhost:8080`.
- **`ENABLE_REDIS=false`:** API-only, no `/admin/queues`, no worker. Omit `REDIS_URL` when disabled.
- **OAuth** (optional on API): `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — both IDs required if either is set.

## Local development

Copy each app's env template locally (gitignored targets — see [env.md](./env.md)):

- Web: `apps/web/.env.example`
- API: `apps/server/.env.example`

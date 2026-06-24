# Arche on Vercel (Path A reference)

Dashboard (KitsuneKode team):

- Web: [arche-landing](https://vercel.com/kitsunekode/arche-landing) → `https://arche.kitsunelabs.xyz`
- API: [arche-template-server](https://vercel.com/kitsunekode/arche-template-server) → `https://api.arche.kitsunelabs.xyz`

Production URLs:

| Project     | URL                                        |
| ----------- | ------------------------------------------ |
| `arche`     | `https://arche-kitsunekode.vercel.app`     |
| `arche-api` | `https://arche-api-kitsunekode.vercel.app` |

Repo config: [apps/web/vercel.json](../apps/web/vercel.json), [apps/server/vercel.json](../apps/server/vercel.json). General Path A guide: [deployment-vercel.md](./deployment-vercel.md).

## One-time dashboard rename (from template-\*)

If projects are still named `template-web` / `template-server`:

1. Vercel → **template-web** → Settings → General → **Project Name** → `arche`
2. Vercel → **template-server** → Settings → General → **Project Name** → `arche-api`
3. Update environment variables below to the new `*.vercel.app` URLs (or your custom domain).
4. Redeploy both projects from `main`.

Old deployment URLs may remain on previous deployments; new production aliases use `arche-kitsunekode.vercel.app` and `arche-api-kitsunekode.vercel.app`.

## Project settings (confirm in dashboard)

### arche (web)

| Setting        | Value      |
| -------------- | ---------- |
| Root Directory | `apps/web` |
| Framework      | Next.js    |
| Node           | 24.x       |

`vercel.json` runs `bun install` from the monorepo root, then `bun run build` in `apps/web`.

### arche-api (server)

| Setting        | Value         |
| -------------- | ------------- |
| Root Directory | `apps/server` |
| Runtime        | Bun 1.x       |

Entry: [apps/server/src/vercel-handler.ts](../apps/server/src/vercel-handler.ts). Build: `turbo run build:vercel --filter=@arche-template/server`.

## Environment — copy/paste matrix

Set on **arche** (Production + Preview):

```env
NEXT_PUBLIC_APP_URL=https://arche-kitsunekode.vercel.app
NEXT_PUBLIC_SITE_URL=https://arche-kitsunekode.vercel.app
NEXT_PUBLIC_API_URL=https://arche-api-kitsunekode.vercel.app
NEXT_PUBLIC_SITE_NAME=Arche
NEXT_PUBLIC_SITE_DESCRIPTION=Preset-led scaffold CLI and project vault for TypeScript, Rust, and Solana — by KitsuneKode.
# Live demo: polling on Vercel (serverless). Set true only when API is a long-lived host (Render Docker).
# NEXT_PUBLIC_ENABLE_CHAT_SSE=false
```

Set on **arche-api** (Production + Preview):

```env
NODE_ENV=production
DATABASE_URL=<neon-postgres-url>
BETTER_AUTH_SECRET=<32+-char-secret>
BETTER_AUTH_URL=https://arche-api-kitsunekode.vercel.app
FRONTEND_URL=https://arche-kitsunekode.vercel.app
ENABLE_REDIS=false
DEMO_AUTO_SIGN_IN=true
```

When enabling queues: `ENABLE_REDIS=true`, `REDIS_URL=<upstash-rediss-url>`. Do not deploy `apps/worker` on Vercel.

Secrets belong only on **arche-api**, never on **arche**.

## Custom domain (arche.kitsunelabs.xyz)

When using custom domains instead of `*.vercel.app`, mirror the same variable **names** with your public origins:

**arche** (web at `https://arche.kitsunelabs.xyz`) — **same-origin API proxy** (recommended):

```env
NEXT_PUBLIC_APP_URL=https://arche.kitsunelabs.xyz
NEXT_PUBLIC_SITE_URL=https://arche.kitsunelabs.xyz
NEXT_PUBLIC_API_URL=https://arche.kitsunelabs.xyz
API_UPSTREAM_URL=https://api.arche.kitsunelabs.xyz
```

`API_UPSTREAM_URL` is **server-only** on the web project. Next.js rewrites `/api/*` and `/health` to the upstream host so the browser never cross-origin fetches the API. With this setup, `/live` chat uses **SSE by default** (no `NEXT_PUBLIC_ENABLE_CHAT_SSE` needed). Polling fallback remains if the stream drops. Local dev: omit `API_UPSTREAM_URL` and keep `NEXT_PUBLIC_API_URL` pointing at `http://localhost:8080` (or your API port).

**arche-api** (upstream at `https://api.arche.kitsunelabs.xyz`):

```env
BETTER_AUTH_URL=https://arche.kitsunelabs.xyz
FRONTEND_URL=https://arche.kitsunelabs.xyz
DEMO_AUTO_SIGN_IN=true
```

When using the proxy, set `BETTER_AUTH_URL` to the **web** origin (where browsers reach `/api/auth`), not the upstream API hostname.

Legacy cross-origin (still supported if you skip `API_UPSTREAM_URL`):

```env
NEXT_PUBLIC_API_URL=https://api.arche.kitsunelabs.xyz
```

`DEMO_AUTO_SIGN_IN=true` is required for the `/live` proof run: sign-up must issue a session so rungs 7–10 unlock without a second sign-in step.

`FRONTEND_URL` must match the **exact** public web origin. If it still points at an old host (for example `https://stack.kitsunelabs.xyz` while the site is `https://arche.kitsunelabs.xyz`), browser calls to `/health`, auth, and tRPC fail CORS — the proof ladder shows "Network error" even when server-side smoke tests pass.

## Deployment protection

`arche-api` may return **401** when Vercel Deployment Protection is on. For smoke tests, add `VERCEL_PROTECTION_BYPASS` or disable protection on the API project. See [deploy-smoke.md](./deploy-smoke.md).

## Smoke tests

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://arche-kitsunekode.vercel.app/
curl -sS -o /dev/null -w "%{http_code}\n" https://arche-api-kitsunekode.vercel.app/health
```

Expect `200` when the API is deployed, env is valid, and protection allows access.

## Related

- [deployment-env.md](./deployment-env.md)
- [production-playbook.md](./production-playbook.md)

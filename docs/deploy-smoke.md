# Deploy smoke tests

Live HTTP checks for production API hosts. Not run in CI unless you opt in.

## Commands

```bash
# Render (default URL)
bun run test:deploy

# Template production hosts (Render + Vercel; Vercel skipped if protected)
bun run test:deploy:all

# Custom set
DEPLOY_SMOKE_TARGETS=https://api.onrender.com,https://api.up.railway.app \
  RUN_DEPLOY_SMOKE=1 bun test tests/src/integration/deploy-smoke.test.ts

# Per-path env vars
RENDER_API_URL=https://arche-template-api.onrender.com \
RAILWAY_API_URL=https://your-api.up.railway.app \
VERCEL_API_URL=https://your-server.vercel.app \
RUN_DEPLOY_SMOKE=1 bun test tests/src/integration/deploy-smoke.test.ts
```

## Vercel deployment protection

`*.vercel.app` previews may return **401 Authentication Required**. Options:

1. Use a **production alias** without protection for smoke tests.
2. Set `VERCEL_PROTECTION_BYPASS` (secret from Vercel → Project → Deployment Protection) when running smoke locally or in a private workflow.

## Railway

1. Deploy from GitHub with root [`railway.toml`](../railway.toml) and `apps/server/Dockerfile`.
2. Set the same env as Render (Neon `DATABASE_URL`, `ENABLE_REDIS=false`, auth vars).
3. Add public domain → `RAILWAY_API_URL=https://<service>.up.railway.app bun run test:deploy`.

Railway CLI: `npx @railway/cli login` then deploy from dashboard or `railway up` (requires linked project).

## Assertions

- `GET /` → `200`, `status: ok`, `redis: disabled` (API-only default)
- `GET /health` → `200`, `database: connected`

120s timeout per request (Render cold start).

## Live demo integration smoke

Exercises tRPC, auth, chat, posts, and SSE against a running API (not run in CI by default):

```bash
RUN_LIVE_DEMO_SMOKE=1 \
  NEXT_PUBLIC_API_URL=https://api.arche.kitsunelabs.xyz \
  NEXT_PUBLIC_APP_URL=https://arche.kitsunelabs.xyz \
  bun test tests/src/live-demo-smoke.test.ts
```

Also check the web route:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://arche.kitsunelabs.xyz/live
```

Requires `DEMO_AUTO_SIGN_IN=true` on the API for auth-gated tests to pass in production.

# Arche on Vercel (Path A reference)

Dashboard (KitsuneKode team):

- Web: [arche](https://vercel.com/kitsunekode/arche)
- API: [arche-api](https://vercel.com/kitsunekode/arche-api)

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

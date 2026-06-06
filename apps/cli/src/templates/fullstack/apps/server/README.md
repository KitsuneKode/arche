# Server workspace

Express API, module-first layout (`src/modules/*`).

- `src/app.ts` — routes and middleware
- `src/server.ts` — Render / Railway / Docker (`listen` + Redis)
- `src/vercel-handler.ts` — Vercel serverless export
- [AGENTS.md](./AGENTS.md) — architecture map

Deploy: [docs/deployment.md](../../docs/deployment.md) (paths A/B/C). Ops checklist: [docs/production-playbook.md](../../docs/production-playbook.md). Env matrix: [deployment-env.md](../../docs/deployment-env.md).

| Path | Host           | Entry / build                                                                |
| ---- | -------------- | ---------------------------------------------------------------------------- |
| A    | Vercel         | `vercel-handler.ts` · `bun run build:vercel --filter=@arche-template/server` |
| B    | Render Docker  | [render.yaml](../../render.yaml) · `server.ts`                               |
| C    | Railway Docker | [railway.toml](../../railway.toml) · `server.ts`                             |

Postgres and Redis: **Neon + Upstash URLs only** (not Render-managed). Verify with `curl https://<api-host>/health`.

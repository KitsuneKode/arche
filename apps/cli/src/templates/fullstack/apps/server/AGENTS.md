# Server Notes

## Purpose

`apps/server` is the Express service: Better Auth, tRPC, health, and Bull Board admin.

## Module-first layout

```
src/
  app.ts
  server.ts
  db/                 # prisma re-export, redis
  common/             # errors, validate, env, middleware
  modules/
    <feature>/
      *.routes.ts     # Express mounts
      *.controller.ts # HTTP handlers (REST modules)
      *.service.ts    # business logic
      *.repository.ts # data access
      *.dto.ts        # Zod schemas
      *.policy.ts     # authorization rules
      *.trpc.ts       # tRPC procedures (when applicable)
```

Dependency direction: `routes → controllers → services → repositories → db`

## tRPC boundary

- **HTTP / Express**: `apps/server/src/modules/*` and `src/app.ts`
- **Client contract**: `@arche-template/trpc` re-exports `AppRouter` and `createCaller` from `@arche-template/server/trpc`
- Add procedures in `modules/<feature>/<feature>.trpc.ts`, compose in `modules/trpc/app.router.ts`

## Read First

- `src/app.ts`
- `src/server.ts`
- `src/common/env.ts`
- `src/modules/trpc/app.router.ts`
- `src/modules/health/health.routes.ts`

## Common Tasks

- New REST feature: add `src/modules/<name>/` with routes → controller → service → repository
- New tRPC feature: add `*.trpc.ts` + wire in `modules/trpc/app.router.ts`
- Middleware: `src/common/middleware/*`
- Env: `src/common/env.ts` (re-exports `@arche-template/backend-common/env`)

## Deploy

Playbook (default Path B): [docs/production-playbook.md](../../docs/production-playbook.md). Hub: [docs/deployment.md](../../docs/deployment.md).

| Path        | Entry                                                | Build                                                                                  |
| ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A — Vercel  | `src/vercel-handler.ts`                              | `bun run build:vercel --filter=@arche-template/server`                                 |
| B — Render  | `src/server.ts` + [render.yaml](../../render.yaml)   | Docker (`apps/server/Dockerfile`); CI: `bun run build --filter=@arche-template/server` |
| C — Railway | `src/server.ts` + [railway.toml](../../railway.toml) | Same Docker image as Path B                                                            |

- Path A: [docs/deployment-vercel.md](../../docs/deployment-vercel.md)
- Path B: [docs/deployment-render.md](../../docs/deployment-render.md)
- Path C: [docs/deployment-railway.md](../../docs/deployment-railway.md)

Postgres/Redis always external (Neon + Upstash). Never Render-managed DB.

## Update When

Route mounts, module layout, tRPC composition, middleware order, or startup behavior changes.

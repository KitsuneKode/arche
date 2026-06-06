/**
 * Deployment guide generator
 *
 * Generates docs/deployment.md adapted to the selected backend, database,
 * and project structure options.
 */

import type { ProjectConfig } from '../../types/schemas'

/** Human-readable backend name for docs */
function backendLabel(backend: ProjectConfig['backend']): string {
  switch (backend) {
    case 'express-bun':
      return 'Express (Bun)'
    case 'hono-bun':
      return 'Hono (Bun)'
    case 'fastify-node':
      return 'Fastify (Node.js)'
    case 'go-fiber':
      return 'Go Fiber'
    case 'rust-axum':
    case 'rust-actix':
      return 'Rust Axum'
    case 'python-fastapi':
      return 'Python FastAPI'
    case 'none':
      return 'None (frontend only)'
  }
}

function backendUsesServiceApi(config: ProjectConfig): boolean {
  return (
    config.backend === 'rust-axum' ||
    config.backend === 'rust-actix' ||
    config.backend === 'go-fiber' ||
    config.backend === 'python-fastapi'
  )
}

export function renderDeploymentGuide(config: ProjectConfig): string {
  if (config.family === 'polyglot') {
    return `# Deployment Guide

Generated for **${config.projectName}** (polyglot monorepo).

## Stack

- Web: \`apps/web\` (Next.js)
- API: \`apps/api\` (Express HTTP boundary)
- Worker: \`apps/worker\` (Bun background process)
- Future services: \`services/*\` for Rust, Go, Python, or other runtimes

## Local services

\`\`\`bash
bun install
bun dev
docker compose up -d redis
\`\`\`

## Docker production shape

\`docker-compose.prod.yml\` defines:

- \`web\` from \`apps/web/Dockerfile\`
- \`api\` from \`apps/api/Dockerfile\`
- \`worker\` from \`apps/worker/Dockerfile\`
- \`redis\` for background job coordination

## Rollout order

1. Deploy \`api\`; verify \`/health\`.
2. Deploy \`web\` with \`NEXT_PUBLIC_API_URL\` pointed at the API host.
3. Deploy \`worker\` only when jobs are used; set \`REDIS_URL\`.
4. Add non-TypeScript services under \`services/*\` only when their runtime owns a clear concern.

## Notes

Polyglot is intentionally service-first. Do not share hidden runtime state across services; use HTTP, queues, events, or generated client contracts.
`
  }

  if (config.family === 'convex' || config.preset === 'convex-product') {
    return `# Deployment Guide

Generated for **${config.projectName}** (Next.js + Convex).

## Stack

- **Frontend**: Next.js on Vercel (recommended)
- **Backend**: Convex Cloud (\`convex deploy\`)
- **Database**: Convex tables in \`convex/schema.ts\`
- **Auth**: Better Auth stubs in \`convex/auth.ts\` — complete wiring per template \`docs/convex-integration.md\`

## Rollout order

1. Create a Convex project: \`bunx convex dev\` (links deployment, writes \`.env.local\`).
2. Deploy Convex functions: \`bunx convex deploy\`.
3. Deploy Next.js to Vercel; set \`NEXT_PUBLIC_CONVEX_URL\` from the Convex dashboard.
4. Configure Better Auth secrets on Vercel and Convex HTTP routes when auth is enabled.

## Environment variables

- **Local / Vercel**: \`NEXT_PUBLIC_CONVEX_URL\`
- **Better Auth** (optional): \`BETTER_AUTH_SECRET\`, \`BETTER_AUTH_URL\`

No Render/Railway API host or external Postgres is required for this route.
`
  }

  const workerLine = config.includeWorker
    ? '- **Path B / C:** deploy `apps/worker` on Render or Railway with `REDIS_URL` (external Upstash).'
    : '- Worker optional unless you enable background jobs.'

  const dockerLine = config.includeDocker
    ? `- Local: \`docker compose\` for ${config.database === 'postgres' ? 'Postgres and ' : config.database === 'mongodb' ? 'MongoDB and ' : ''}Redis.`
    : `- Provide managed Postgres and Redis URLs in production (Neon + Upstash recommended).`

  if (config.family === 'backend') {
    return `# Deployment Guide

Generated for **${config.projectName}** (${backendLabel(config.backend)} API-only service).

## Stack

- Backend: ${backendLabel(config.backend)}
- Database: none by default
- Web: none

## Rollout order

1. Deploy this service to Render, Railway, Fly.io, or any Node/Bun host.
2. Set \`PORT\` and \`FRONTEND_URL\` for CORS.
3. Verify \`/health\`.

## Commands

\`\`\`bash
bun install
bun run build
bun run start
\`\`\`

## Local services

${config.includeDocker ? '- Docker is optional for this API-only starter; add database services when you add persistence.' : '- No Docker services are generated for this API-only starter.'}
`
  }

  const serverBlock =
    config.backend === 'express-bun' || config.backend === 'hono-bun'
      ? `
## Path A — Vercel (web + API)

- Deploy \`apps/web\` and \`apps/server\` as **two Vercel projects**.
- Server entry: \`apps/server/src/vercel-handler.ts\`; build: \`bun run build:vercel --filter=@arche-template/server\`.
- Set \`DATABASE_URL\`, \`BETTER_AUTH_*\`, \`FRONTEND_URL\`, \`REDIS_URL\` on the **server** project (Neon, Upstash).
- Web: \`NEXT_PUBLIC_API_URL\` → server project URL.

See template repo \`docs/deployment-vercel.md\`.

## Path B — Vercel web + Render API

- Deploy \`apps/web\` on Vercel; \`apps/server\` on Render Docker via \`render.yaml\` (API only).
- Set external \`DATABASE_URL\` (Neon) and \`REDIS_URL\` (Upstash) in Render — **not** Render-managed Postgres/Redis.
- Do **not** use \`bun run apps/server/dist/server.js\` from repo root on Render.

See template repo \`docs/deployment-render.md\`.

## Path C — Vercel web + Railway API

- Deploy \`apps/web\` on Vercel; \`apps/server\` on Railway Docker (\`railway.toml\` / \`apps/server/Dockerfile\`, repo root context).
- Same env as Path B: Neon \`DATABASE_URL\`, Upstash \`REDIS_URL\`, or \`ENABLE_REDIS=false\`.

See template repo \`docs/deployment-railway.md\`.

${workerLine}
`
      : backendUsesServiceApi(config)
        ? `
## Backend hosting

- Deploy \`services/api\` to Render or Railway Docker with \`services/api/Dockerfile\`.
- Local API command: \`cargo run --manifest-path services/api/Cargo.toml\`.
- Set \`DATABASE_URL\`, \`FRONTEND_URL\`, and \`REDIS_URL\` or \`ENABLE_REDIS=false\` on the API host.
- Web: \`NEXT_PUBLIC_API_URL\` points at the service API URL.
`
        : config.backend !== 'none'
          ? `
## Backend hosting

Deploy \`apps/server\` to Render or Railway Docker (see template \`docs/deployment-render.md\` / \`docs/deployment-railway.md\`). Use external Neon + Upstash URLs only.
`
          : ''

  return `# Deployment Guide

Generated for **${config.projectName}** (${backendLabel(config.backend)}, ${config.database}, ${config.orm}).

Production playbook (default Path B): [production-playbook.md](https://github.com/KitsuneKode/arche/blob/main/docs/production-playbook.md). Env matrix: [deployment-env.md](https://github.com/KitsuneKode/arche/blob/main/docs/deployment-env.md) or maintain \`docs/deployment-env.md\` in this repo.

## Stack

- Backend: ${backendLabel(config.backend)}
- Database: ${config.database}
- ORM: ${config.orm}

## Rollout order

1. Provision Neon (Postgres) and Upstash (Redis), or \`ENABLE_REDIS=false\`.
2. Deploy API; run migrations; verify \`/health\`.
3. Deploy web with \`NEXT_PUBLIC_API_URL\` pointing at the API.
4. Smoke: \`bun run test:deploy\` (set \`RENDER_API_URL\`, \`RAILWAY_API_URL\`, or \`VERCEL_API_URL\`). See template \`docs/deploy-smoke.md\`.
${serverBlock}
## Required environment variables

Use one matrix for all targets — see template \`docs/deployment-env.md\`:

- **Web (Vercel):** \`NEXT_PUBLIC_APP_URL\`, \`NEXT_PUBLIC_API_URL\`
- **API:** \`DATABASE_URL\`, \`BETTER_AUTH_SECRET\`, \`BETTER_AUTH_URL\`, \`FRONTEND_URL\`, \`REDIS_URL\` or \`ENABLE_REDIS=false\`

## Local services

${dockerLine}

## Notes

This guide was generated by \`@arche/create\`. Hub: [docs/deployment.md](https://github.com/KitsuneKode/arche/blob/main/docs/deployment.md). Default ops: [docs/production-playbook.md](https://github.com/KitsuneKode/arche/blob/main/docs/production-playbook.md).
`
}

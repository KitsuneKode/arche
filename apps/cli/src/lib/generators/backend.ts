/**
 * Backend generator
 *
 * Post-scaffold transformations for non-default backends.
 * The template ships with express-bun as the default. When a different
 * backend is selected, this generator rewrites the relevant files.
 */

import { readFile, writeFile, rm, mkdir, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import type { ProjectConfig } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'
import { buildServerEnv } from './env'
import { applyRustServiceApiScaffold } from './rust'

// =============================================================================
// Hono on Bun
// =============================================================================

function honoAppTs(): string {
  return `import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from '@arche-template/auth/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createTRPCContext } from '@arche-template/server/trpc'
import { env } from './common/env.js'

const app = new Hono()

// Security headers (expand as needed for production)
app.use('*', async (c, next) => {
  c.res.headers.set('X-Content-Type-Options', 'nosniff')
  c.res.headers.set('X-Frame-Options', 'DENY')
  c.res.headers.set('X-XSS-Protection', '1; mode=block')
  await next()
})

// CORS
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
)

// Better Auth (fetch handler)
app.all('/api/auth/*', (c) => auth.handler(c.req.raw))

// tRPC (fetch adapter)
app.use('/api/trpc/*', async (c) => {
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () =>
      createTRPCContext({ headers: c.req.raw.headers }),
  })
  return response
})

// Health check (add DB ping as needed)
app.get('/health', (c) => c.json({ status: 'OK', timestamp: Date.now() }))

// 404 catch-all
app.all('*', (c) => c.json({ error: 'Not found' }, 404))

export { app }
`
}

function honoServerTs(): string {
  return `import { validateEnvironment } from '@arche-template/backend-common/validate-env'
import { env } from './common/env.js'
import { logger } from './common/logger.js'
import { app } from './app'

validateEnvironment('server')

const port = env.PORT

const server = Bun.serve({
  port,
  fetch: app.fetch,
  idleTimeout: 30,
})

logger.info(\`Server listening on http://localhost:\${server.port}\`)

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down...')
  server.stop()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
`
}

function honoPackageJsonPatch(): {
  addDeps: Record<string, string>
  removeDeps: string[]
  removeDevDeps: string[]
  scriptOverrides: Record<string, string>
} {
  return {
    addDeps: {
      hono: '^4.7.0',
    },
    removeDeps: ['express', 'cors'],
    removeDevDeps: ['@types/express', '@types/cors'],
    scriptOverrides: {
      dev: 'bun run --watch src/server.ts',
      build: 'bun build ./src/server.ts --outdir ./dist --target bun --minify --sourcemap',
      start: 'bun run dist/server.js',
    },
  }
}

// =============================================================================
// tRPC adapter swap
// =============================================================================

/** Rewrite apps/server/src/modules/trpc/trpc.ts for fetch-based context */
const HONO_EXPRESS_ARTIFACTS = [
  'src/vercel-handler.ts',
  'src/common/validate.ts',
  'src/modules/trpc/trpc.routes.ts',
  'src/modules/chat/chat.routes.ts',
  'src/modules/live/live.routes.ts',
  'src/modules/admin/admin.routes.ts',
  'src/modules/admin/admin.controller.ts',
  'src/modules/admin/admin.service.ts',
  'src/modules/auth/auth.routes.ts',
  'src/modules/health/health.routes.ts',
  'src/modules/health/health.controller.ts',
  'src/modules/root/root.routes.ts',
  'src/modules/root/root.controller.ts',
] as const

function trpcContextFetch(): string {
  return `import { initTRPC, TRPCError } from '@trpc/server'
import { auth } from '@arche-template/auth/server'
import { prisma as db } from '@arche-template/store'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { logger } from '../../common/logger.js'

/**
 * tRPC context for fetch-based backends (Hono, etc.)
 * Accepts web-standard Headers instead of Express req/res.
 */
export const createTRPCContext = async ({ headers }: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers })
  return { session, db }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

/**
 * Timing middleware — logs slow procedures, adds artificial delay in dev.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (process.env.NODE_ENV === 'development') {
    const delay = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const result = await next()
  const elapsed = Date.now() - start

  if (elapsed > 1000) {
    logger.warn(\`Slow tRPC procedure: \${path} took \${elapsed}ms\`)
  }

  return result
})

/** Public procedure — no auth required */
export const publicProcedure = t.procedure.use(timingMiddleware)

/** Protected procedure — requires authenticated session */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })
`
}

/** Keep @arche-template/trpc as a thin re-export for web clients */
function trpcIndexFetch(): string {
  return `export type { AppRouter, RouterInputs, RouterOutputs } from '@arche-template/server/trpc'
`
}

/** Server-side tRPC barrel after removing Express-only route modules (Hono fetch adapter). */
function trpcIndexFetchServer(): string {
  return `import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { appRouter } from './app.router'
import { createCallerFactory, createTRPCContext } from './trpc'

export type RouterInputs = inferRouterInputs<typeof appRouter>
export type RouterOutputs = inferRouterOutputs<typeof appRouter>

export const createCaller = createCallerFactory(appRouter)

export { appRouter, createTRPCContext, createCallerFactory }
export type { AppRouter } from './app.router'
`
}

// =============================================================================
// Rust (Actix workspace stub)
// =============================================================================

function rustCargoWorkspaceToml(): string {
  return `[workspace]
members = ["services/api"]
resolver = "2"
`
}

function rustServiceDockerfile(): string {
  return `# syntax=docker/dockerfile:1
FROM rust:1-bookworm AS builder
WORKDIR /app
COPY Cargo.toml ./
COPY services/api/Cargo.toml services/api/Cargo.toml
COPY services/api/src services/api/src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/*-api /app/server
ENV PORT=3001
EXPOSE 3001
CMD ["./server"]
`
}

async function patchRootPackageForServiceApi(destinationDir: string): Promise<void> {
  const packageJsonPath = join(destinationDir, 'package.json')
  try {
    const raw = await readFile(packageJsonPath, 'utf8')
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> }
    const scripts = pkg.scripts ?? {}

    delete scripts['dev:server']
    delete scripts['dev:worker']
    scripts['dev:api'] = 'cargo run --manifest-path services/api/Cargo.toml'
    scripts['build:api'] = 'cargo build --manifest-path services/api/Cargo.toml --release'
    scripts['docker:build'] = 'docker build -f services/api/Dockerfile .'

    pkg.scripts = scripts
    await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
  } catch {
    // Standalone service families may not have a JavaScript root package.
  }
}

// =============================================================================
// Rust / Actix Web
// =============================================================================

function rustActixCargoToml(projectName: string): string {
  const safeName = sanitizeProjectName(projectName).replace(/-/g, '_')
  return `[package]
name = "${safeName}-api"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4"
actix-cors = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
dotenvy = "0.15"
`
}

function rustActixMainRs(): string {
  return `use actix_cors::Cors;
use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};

#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let frontend_url =
        std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());

    tracing::info!("Server listening on http://0.0.0.0:{}", port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin(&frontend_url)
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec!["Authorization", "Content-Type"])
            .supports_credentials();

        App::new().wrap(cors).service(health)
    })
    .bind(("0.0.0.0", port.parse::<u16>().unwrap_or(3001)))?
    .run()
    .await
}
`
}

function rustActixReadme(projectName: string): string {
  return `# ${projectName} API

Rust API service built with [Actix Web](https://actix.rs/).

## Prerequisites

- [Rust](https://rustup.rs/) (stable)

## Quick Start

\`\`\`sh
cp .env.example .env
cargo run
\`\`\`

Server listens on \`PORT\` (default \`3001\`).
`
}

// =============================================================================
// Go / Fiber (stub — experimental)
// =============================================================================

function goFiberStub(): Record<string, string> {
  return {
    'go.mod': `module api

go 1.22

require (
\tgithub.com/gofiber/fiber/v3 v3.0.0-beta
\tgithub.com/joho/godotenv v1.5
)
`,
    'main.go': `package main

import (
\t"log"
\t"os"

\t"github.com/gofiber/fiber/v3"
\t"github.com/joho/godotenv"
)

func main() {
\tgodotenv.Load()

\tapp := fiber.New()

\tapp.Get("/health", func(c fiber.Ctx) error {
\t\treturn c.JSON(fiber.Map{
\t\t\t"status": "ok",
\t\t})
\t})

\tport := os.Getenv("PORT")
\tif port == "" {
\t\tport = "3001"
\t}

\tlog.Fatal(app.Listen(":" + port))
}
`,
  }
}

// =============================================================================
// Python / FastAPI (stub — experimental)
// =============================================================================

function pythonFastapiStub(): Record<string, string> {
  return {
    'requirements.txt': `fastapi==0.115
uvicorn[standard]==0.34
pydantic==2.10
python-dotenv==1.0
`,
    'main.py': `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import uvicorn

load_dotenv()

app = FastAPI(title="API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "3001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
`,
  }
}

// =============================================================================
// Public API
// =============================================================================

async function writeFile_(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

async function patchPackageJson(
  packageJsonPath: string,
  patch: ReturnType<typeof honoPackageJsonPatch>,
): Promise<void> {
  const raw = await readFile(packageJsonPath, 'utf8')
  const pkg = JSON.parse(raw) as Record<string, unknown>

  // Patch dependencies
  const deps = (pkg.dependencies ?? {}) as Record<string, string>
  for (const name of patch.removeDeps) delete deps[name]
  Object.assign(deps, patch.addDeps)
  pkg.dependencies = deps

  // Patch devDependencies
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>
  for (const name of patch.removeDevDeps) delete devDeps[name]
  pkg.devDependencies = devDeps

  // Patch scripts
  const scripts = (pkg.scripts ?? {}) as Record<string, string>
  Object.assign(scripts, patch.scriptOverrides)
  pkg.scripts = scripts

  await writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
}

/**
 * Detect the server directory based on the project layout.
 * - fullstack: apps/server/
 * - polyglot: apps/api/
 * - default: apps/server/
 */
async function detectServerDir(destinationDir: string): Promise<string> {
  // Check for polyglot layout first
  try {
    await stat(join(destinationDir, 'apps', 'api'))
    return 'apps/api'
  } catch {
    // fall through
  }
  return 'apps/server'
}

/** Relay Lattice is Express + Prisma-only; strip server wiring for other stacks. */
export async function stripRelayLatticeFromProject(destinationDir: string): Promise<void> {
  const serverDir = await detectServerDir(destinationDir)
  await rm(join(destinationDir, serverDir, 'src/modules/lattice'), { recursive: true, force: true })
  await rm(join(destinationDir, serverDir, 'src/modules/live/live.routes.ts'), { force: true })

  const chatEventsPath = join(destinationDir, serverDir, 'src/modules/chat/chat.events.ts')
  try {
    await writeFile(
      chatEventsPath,
      `import { EventEmitter } from 'node:events'

const bus = new EventEmitter()

export type ChatStreamEvent = {
  type: 'message'
  messageId: string
}

export function emitChatMessage(messageId: string) {
  bus.emit('message', { type: 'message', messageId } satisfies ChatStreamEvent)
}

export function subscribeChatEvents(listener: (event: ChatStreamEvent) => void) {
  bus.on('message', listener)
  return () => {
    bus.off('message', listener)
  }
}
`,
    )
  } catch {
    // chat module not present
  }

  const appRouterPath = join(destinationDir, serverDir, 'src/modules/trpc/app.router.ts')
  try {
    const content = await readFile(appRouterPath, 'utf8')
    const patched = content
      .replace(/import { latticeRouter } from '\.\.\/lattice\/lattice\.trpc'\n/, '')
      .replace(/\n  lattice: latticeRouter,/, '')
    if (patched !== content) {
      await writeFile(appRouterPath, patched)
    }
  } catch {
    // tRPC router not present
  }

  const appPath = join(destinationDir, serverDir, 'src/app.ts')
  try {
    const content = await readFile(appPath, 'utf8')
    const patched = content
      .replace(/import { liveRoutes } from '\.\/modules\/live\/live\.routes'\n/, '')
      .replace(/\napp\.use\('\/api\/live', liveRoutes\)/, '')
    if (patched !== content) {
      await writeFile(appPath, patched)
    }
  } catch {
    // Express app not present
  }

  const serverPath = join(destinationDir, serverDir, 'src/server.ts')
  try {
    let content = await readFile(serverPath, 'utf8')
    content = content.replace(
      /\nfunction isLatticeRoundEngineEnabled\(\): boolean \{\n  return process\.env\.LATTICE_ROUND_ENGINE\?\.trim\(\) === 'true'\n\}\n/,
      '\n',
    )
    content = content.replace(
      /\n  const latticeEngineEnabled[\s\S]*?logger\.info\('Relay Lattice round engine started'\)\n  \}/,
      '',
    )
    await writeFile(serverPath, content)
  } catch {
    // server bootstrap not present
  }
}

export async function stripLiveDemoWeb(destinationDir: string): Promise<void> {
  const livePaths = [
    'apps/web/app/live',
    'apps/web/app/(sandbox)',
    'apps/web/app/(auth)',
    'apps/web/components/live',
    'apps/web/components/play',
    'apps/web/components/sandbox',
    'apps/web/lib/live-feed',
    'apps/web/lib/live-chat-sync.ts',
    'apps/web/lib/live-chat-sync-policy.ts',
    'apps/server/src/modules/live',
    'apps/server/src/modules/lattice',
    'apps/web/lib/proof-run',
    'apps/web/lib/proof-run-storage.ts',
    'apps/web/lib/client-mounted.ts',
    'apps/web/lib/api-health.ts',
    'apps/web/lib/use-api-reachable.ts',
    'apps/web/lib/relay-run',
  ]
  for (const relativePath of livePaths) {
    await rm(join(destinationDir, relativePath), { recursive: true, force: true })
  }
  const homePage = join(destinationDir, 'apps/web/app/page.tsx')
  try {
    const content = await readFile(homePage, 'utf8')
    const withoutLiveCta = content
      .replace(/\s*<Link href="\/live"[^>]*>[\s\S]*?<\/Link>\s*/g, '\n')
      .replace(/import Link from 'next\/link'\n/, '')
    if (withoutLiveCta !== content) {
      await writeFile(homePage, withoutLiveCta)
    }
  } catch {
    // Web app not present
  }
}

async function patchFullstackHomepageCopy(
  destinationDir: string,
  backend: ProjectConfig['backend'],
): Promise<void> {
  if (backend !== 'hono-bun') return

  const pagePath = join(destinationDir, 'apps/web/app/page.tsx')
  try {
    const content = await readFile(pagePath, 'utf8')
    const patched = content
      .replace('an Express API', 'a Hono API')
      .replaceAll('Express + tRPC', 'Hono + tRPC')
    if (patched !== content) {
      await writeFile(pagePath, patched)
    }
  } catch {
    // Web app not present (backend-only family)
  }
}

/**
 * Apply backend-specific transformations to the scaffolded project.
 * Called after template copy and cleanup, before env/docker/ci generation.
 */
export async function applyBackendTransform(
  destinationDir: string,
  config: ProjectConfig,
): Promise<void> {
  if (config.backend === 'express-bun') return // default, no transformation needed

  const serverDir = await detectServerDir(destinationDir)

  if (config.backend === 'hono-bun') {
    // 1. Rewrite server app files
    await writeFile_(join(destinationDir, serverDir, 'src/app.ts'), honoAppTs())
    await writeFile_(join(destinationDir, serverDir, 'src/server.ts'), honoServerTs())
    // 2. Remove Express-only middleware and route modules (not applicable to Hono)
    await rm(join(destinationDir, serverDir, 'src/middlewares'), {
      recursive: true,
      force: true,
    })
    await rm(join(destinationDir, serverDir, 'src/common/middleware'), {
      recursive: true,
      force: true,
    })
    for (const relativePath of HONO_EXPRESS_ARTIFACTS) {
      await rm(join(destinationDir, serverDir, relativePath), { force: true })
    }

    // 3. Patch server package.json
    await patchPackageJson(join(destinationDir, serverDir, 'package.json'), honoPackageJsonPatch())

    // 4. Rewrite tRPC package for fetch-based context (fullstack only)
    const trpcSrcDir = join(destinationDir, 'packages', 'trpc', 'src')
    try {
      await stat(trpcSrcDir)
      await writeFile_(
        join(destinationDir, serverDir, 'src/modules/trpc/trpc.ts'),
        trpcContextFetch(),
      )
      await writeFile_(
        join(destinationDir, serverDir, 'src/modules/trpc/index.ts'),
        trpcIndexFetchServer(),
      )
      await writeFile_(join(destinationDir, 'packages/trpc/src/index.ts'), trpcIndexFetch())
    } catch {
      // tRPC package not present — standalone or polyglot without tRPC
    }

    await patchFullstackHomepageCopy(destinationDir, config.backend)
    return
  }

  if (config.backend === 'rust-axum' || config.backend === 'rust-actix') {
    const projectName = config.projectName
    const apiDir = join(destinationDir, 'services', 'api')
    const useActix = config.backend === 'rust-actix'

    await rm(join(destinationDir, serverDir), { recursive: true, force: true })
    await mkdir(join(apiDir, 'src'), { recursive: true })

    if (useActix) {
      await rm(apiDir, { recursive: true, force: true })
      await mkdir(join(apiDir, 'src'), { recursive: true })
      await writeFile_(join(apiDir, 'Cargo.toml'), rustActixCargoToml(projectName))
      await writeFile_(join(apiDir, 'src', 'main.rs'), rustActixMainRs())
      await writeFile_(join(apiDir, 'README.md'), rustActixReadme(projectName))
      await writeFile_(join(destinationDir, 'Cargo.toml'), rustCargoWorkspaceToml())
      await writeFile_(join(apiDir, '.env.example'), buildServerEnv(config))
      await writeFile_(join(apiDir, 'Dockerfile'), rustServiceDockerfile())
    } else {
      await applyRustServiceApiScaffold(destinationDir, config)
    }

    await patchRootPackageForServiceApi(destinationDir)
    await stripLiveDemoWeb(destinationDir)

    return
  }

  if (config.backend === 'go-fiber') {
    const apiDir = join(destinationDir, 'services', 'api')

    await rm(join(destinationDir, serverDir), { recursive: true, force: true })

    const stubs = goFiberStub()
    for (const [file, content] of Object.entries(stubs)) {
      await writeFile_(join(apiDir, file), content)
    }
    await writeFile_(join(apiDir, '.env.example'), buildServerEnv(config))

    return
  }

  if (config.backend === 'python-fastapi') {
    const apiDir = join(destinationDir, 'services', 'api')

    await rm(join(destinationDir, serverDir), { recursive: true, force: true })

    const stubs = pythonFastapiStub()
    for (const [file, content] of Object.entries(stubs)) {
      await writeFile_(join(apiDir, file), content)
    }
    await writeFile_(join(apiDir, '.env.example'), buildServerEnv(config))

    return
  }
}

/** Rust family uses the Axum module scaffold; Actix applies only to fullstack backend swaps. */
export async function applyRustFamilyTransform(
  _destinationDir: string,
  config: ProjectConfig,
): Promise<void> {
  if (config.family !== 'rust' || config.backend !== 'rust-actix') return
  // Module-first rust template is Axum-only. Fullstack can still select rust-actix for services/api.
}

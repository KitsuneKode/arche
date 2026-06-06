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

// =============================================================================
// Hono on Bun
// =============================================================================

function honoAppTs(): string {
  return `import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from '@arche-template/auth/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createTRPCContext } from '@arche-template/server/trpc'
import { config } from './utils/config'

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
    origin: config.getConfig('frontendUrl'),
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
  return `import { config } from './utils/config'
import { logger } from './utils/logger'
import { app } from './app'

// Validate all required environment variables on startup
config.validateAll()

const port = config.getConfig('port')

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
function trpcContextFetch(): string {
  return `import { initTRPC, TRPCError } from '@trpc/server'
import { auth, fromNodeHeaders } from '@arche-template/auth/server'
import { prisma as db } from '@arche-template/store'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { logger } from '@arche-template/backend-common/logger'

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
export { appRouter, createCaller, createTRPCContext, createCallerFactory } from '@arche-template/server/trpc'
`
}

// =============================================================================
// Rust / Axum
// =============================================================================

function rustAxumCargoToml(projectName: string): string {
  const safeName = sanitizeProjectName(projectName).replace(/-/g, '_')
  return `[package]
name = "${safeName}-api"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.8"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tower-http = { version = "0.6", features = ["cors", "trace"] }
tracing = "0.1"
tracing-subscriber = "0.3"
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres", "sqlite", "migrate"] }
dotenvy = "0.15"
uuid = { version = "1", features = ["v4"] }
`
}

function rustCargoWorkspaceToml(): string {
  return `[workspace]
members = ["services/api"]
resolver = "2"
`
}

function rustAxumMainRs(): string {
  return `use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

mod config;
mod routes;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    dotenvy::dotenv().ok();

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    let allowed_origin = frontend_url
        .parse::<axum::http::HeaderValue>()
        .unwrap_or_else(|_| axum::http::HeaderValue::from_static("http://localhost:3000"));

    let cors = CorsLayer::new()
        .allow_origin(allowed_origin)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(routes::health))
        .layer(cors);

    let addr = format!("0.0.0.0:{}", port);
    info!("Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
`
}

function rustAxumConfigRs(): string {
  return `use std::env;

pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub frontend_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "3001".to_string())
                .parse()
                .unwrap_or(3001),
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://postgres:postgres@localhost:5432/app".to_string()),
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
        }
    }
}
`
}

function rustAxumRoutesRs(): string {
  return `use axum::Json;
use serde_json::{json, Value};

pub async fn health() -> Json<Value> {
    Json(json!({
        "status": "ok"
    }))
}
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

function rustAxumReadme(projectName: string): string {
  return `# ${projectName} API

Rust API service built with [Axum](https://github.com/tokio-rs/axum).

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [PostgreSQL](https://www.postgresql.org/) (or SQLite)

## Quick Start

\`\`\`sh
cp .env.example .env
cargo run
\`\`\`

## Build

\`\`\`sh
cargo build --release
\`\`\`

The binary will be at \`target/release/${sanitizeProjectName(projectName).replace(/-/g, '_')}-api\`.
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

    // 2. Remove Express-only middleware (not applicable to Hono)
    await rm(join(destinationDir, serverDir, 'src/middlewares'), {
      recursive: true,
      force: true,
    })
    await rm(join(destinationDir, serverDir, 'src/common/middleware'), {
      recursive: true,
      force: true,
    })

    // 3. Patch server package.json
    await patchPackageJson(join(destinationDir, serverDir, 'package.json'), honoPackageJsonPatch())

    // 4. Rewrite tRPC package for fetch-based context (fullstack only)
    const trpcSrcDir = join(destinationDir, 'packages', 'trpc', 'src')
    try {
      await stat(trpcSrcDir)
      await writeFile_(
        join(destinationDir, 'apps/server/src/modules/trpc/trpc.ts'),
        trpcContextFetch(),
      )
      await writeFile_(join(destinationDir, 'packages/trpc/src/index.ts'), trpcIndexFetch())
    } catch {
      // tRPC package not present — standalone or polyglot without tRPC
    }

    return
  }

  if (config.backend === 'rust-axum' || config.backend === 'rust-actix') {
    const projectName = config.projectName
    const apiDir = join(destinationDir, 'services', 'api')
    const useActix = config.backend === 'rust-actix'

    await rm(join(destinationDir, serverDir), { recursive: true, force: true })
    await mkdir(join(apiDir, 'src'), { recursive: true })

    if (useActix) {
      await writeFile_(join(apiDir, 'Cargo.toml'), rustActixCargoToml(projectName))
      await writeFile_(join(apiDir, 'src', 'main.rs'), rustActixMainRs())
      await writeFile_(join(apiDir, 'README.md'), rustActixReadme(projectName))
    } else {
      await writeFile_(join(apiDir, 'Cargo.toml'), rustAxumCargoToml(projectName))
      await writeFile_(join(apiDir, 'src', 'main.rs'), rustAxumMainRs())
      await writeFile_(join(apiDir, 'src', 'config.rs'), rustAxumConfigRs())
      await writeFile_(join(apiDir, 'src', 'routes.rs'), rustAxumRoutesRs())
      await writeFile_(join(apiDir, 'README.md'), rustAxumReadme(projectName))
    }

    await writeFile_(join(destinationDir, 'Cargo.toml'), rustCargoWorkspaceToml())
    await writeFile_(join(apiDir, '.env.example'), buildServerEnv(config))
    await writeFile_(join(apiDir, 'Dockerfile'), rustServiceDockerfile())
    await patchRootPackageForServiceApi(destinationDir)

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

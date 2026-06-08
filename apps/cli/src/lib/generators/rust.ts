/**
 * Rust family scaffold transforms — token replacement, optional modules, Docker/CI.
 */

import { existsSync } from 'node:fs'
import { cp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectConfig } from '../../types/schemas'
import { rustUsesSqlx } from '../../types/schemas'
import { sanitizeProjectName } from '../slug'

const TEXT_EXTENSIONS = new Set([
  '.rs',
  '.toml',
  '.md',
  '.sql',
  '.yml',
  '.yaml',
  '.example',
  '.json',
  '',
])

function crateName(projectName: string): string {
  return sanitizeProjectName(projectName).replace(/-/g, '_')
}

function databaseUrl(config: ProjectConfig): string {
  const db = config.database
  if (db === 'postgres') {
    const dbName = sanitizeProjectName(config.projectName).replace(/-/g, '_')
    return `postgres://user:password@localhost:5432/${dbName}`
  }
  if (db === 'sqlite') {
    return 'sqlite://./data.db'
  }
  return ''
}

export function renderRustCargoToml(config: ProjectConfig): string {
  const name = crateName(config.projectName)
  const useSqlx = rustUsesSqlx(config)
  const sqlxBlock = useSqlx
    ? `
sqlx = { version = "0.8", features = ["runtime-tokio", "chrono", "uuid", "migrate", "${
        config.database === 'sqlite' ? 'sqlite' : 'postgres'
      }"] }
`
    : ''

  return `[package]
name = "${name}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.8"
tokio = { version = "1", features = ["full"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["cors", "trace", "request-id"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
dotenvy = "0.15"
uuid = { version = "1", features = ["serde", "v4"] }
chrono = { version = "0.4", features = ["serde"] }
async-trait = "0.1"
${sqlxBlock}
[dev-dependencies]
http-body-util = "0.1"
tower = { version = "0.5", features = ["util"] }
`
}

export function renderRustDockerfile(): string {
  return `# syntax=docker/dockerfile:1
FROM rust:1-bookworm AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/* /app/server
COPY migrations ./migrations
ENV PORT=3001
EXPOSE 3001
CMD ["./server"]
`
}

export function renderRustDockerCompose(config: ProjectConfig): string {
  if (config.database !== 'postgres') {
    return `# API runs locally with \`cargo run\`. No database container for this configuration.
`
  }
  const dbName = sanitizeProjectName(config.projectName).replace(/-/g, '_')
  return `services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${dbName}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
`
}

export function renderRustCi(config: ProjectConfig): string {
  const sqlxSteps =
    rustUsesSqlx(config) && config.database === 'postgres'
      ? `
      - name: Install sqlx-cli
        run: cargo install sqlx-cli --no-default-features --features postgres

      - name: Verify migrations (offline)
        run: cargo sqlx prepare --check || true
        continue-on-error: true
`
      : ''

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
${sqlxSteps}
      - name: Format
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Test
        run: cargo test
`
}

export function renderRustEnvExample(config: ProjectConfig): string {
  const url = databaseUrl(config)
  return `PORT=3001
RUST_LOG=info,${crateName(config.projectName)}=debug
${url ? `DATABASE_URL=${url}\n` : '# DATABASE_URL= (not used — API-only scaffold)\n'}`
}

async function walkReplaceTokens(dir: string, replacements: Record<string, string>): Promise<void> {
  const entries = await readdir(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    const st = await stat(full)
    if (st.isDirectory()) {
      await walkReplaceTokens(full, replacements)
      continue
    }
    const ext = entry.includes('.') ? entry.slice(entry.lastIndexOf('.')) : ''
    if (!TEXT_EXTENSIONS.has(ext) && entry !== 'Dockerfile' && entry !== '.env.example') continue
    let content = await readFile(full, 'utf8')
    for (const [token, value] of Object.entries(replacements)) {
      content = content.split(token).join(value)
    }
    await writeFile(full, content)
  }
}

/** Apply Rust-family transforms after template copy. */
export async function applyRustScaffoldTransform(
  destinationDir: string,
  config: ProjectConfig,
): Promise<string[]> {
  const generated: string[] = []
  const projectName = sanitizeProjectName(config.projectName)
  const replacements: Record<string, string> = {
    __PROJECT_NAME__: projectName,
    __CRATE_NAME__: crateName(projectName),
    __DATABASE_URL__: databaseUrl(config),
  }

  await walkReplaceTokens(destinationDir, replacements)

  await writeFile(join(destinationDir, 'Cargo.toml'), renderRustCargoToml(config))
  generated.push('Cargo.toml')

  await writeFile(join(destinationDir, '.env.example'), renderRustEnvExample(config))
  generated.push('.env.example')

  if (config.example !== 'posts') {
    await rm(join(destinationDir, 'src', 'modules', 'posts'), { recursive: true, force: true })
    await rm(join(destinationDir, 'src', 'modules', 'users'), { recursive: true, force: true })
    await writeFile(join(destinationDir, 'src', 'modules', 'mod.rs'), `pub mod health;\n`)
    const appPath = join(destinationDir, 'src', 'app.rs')
    let appSrc = await readFile(appPath, 'utf8')
    appSrc = appSrc.replace(/\s*\.merge\(modules::posts::routes::router\(\)\)\n/, '\n')
    await writeFile(appPath, appSrc)
    generated.push('src/modules/mod.rs (trimmed)')
  }

  if (config.database === 'sqlite') {
    await writeFile(
      join(destinationDir, 'src', 'db', 'pool.rs'),
      `use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;

use crate::config::Config;
use crate::error::AppError;

pub async fn connect(config: &Config) -> Result<Option<SqlitePool>, AppError> {
    let Some(url) = config.database_url.as_deref() else {
        return Ok(None);
    };
    let pool = SqlitePoolOptions::new().max_connections(5).connect(url).await?;
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| AppError::Internal(format!("migration: {e}")))?;
    Ok(Some(pool))
}
`,
    )
    await writeFile(
      join(destinationDir, 'src', 'state.rs'),
      `use std::sync::Arc;

use sqlx::SqlitePool;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub db: Option<Arc<SqlitePool>>,
}

impl AppState {
    pub fn new(config: Config, db: Option<SqlitePool>) -> Self {
        Self {
            config,
            db: db.map(Arc::new),
        }
    }
}
`,
    )
    await writeFile(
      join(destinationDir, 'migrations', '0001_init.sql'),
      `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS posts_author_id_idx ON posts (author_id);
`,
    )
    for (const rel of ['src/modules/posts/repository.rs', 'src/modules/posts/service.rs']) {
      const filePath = join(destinationDir, rel)
      let content = await readFile(filePath, 'utf8')
      content = content.replaceAll('PgPool', 'SqlitePool')
      await writeFile(filePath, content)
    }
    generated.push('sqlite pool/state/migration')
  }

  if (!rustUsesSqlx(config)) {
    await rm(join(destinationDir, 'migrations'), { recursive: true, force: true })
    await writeFile(
      join(destinationDir, 'src', 'db', 'pool.rs'),
      `use crate::config::Config;
use crate::error::AppError;

pub async fn connect(_config: &Config) -> Result<Option<()>, AppError> {
    Ok(None)
}
`,
    )
    await writeFile(
      join(destinationDir, 'src', 'state.rs'),
      `use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
}

impl AppState {
    pub fn new(config: Config, _db: Option<()>) -> Self {
        Self { config }
    }
}
`,
    )
    if (config.example === 'posts') {
      await rm(join(destinationDir, 'src', 'modules', 'posts'), { recursive: true, force: true })
      await rm(join(destinationDir, 'src', 'modules', 'users'), { recursive: true, force: true })
      await writeFile(join(destinationDir, 'src', 'modules', 'mod.rs'), `pub mod health;\n`)
      let appSrc = await readFile(join(destinationDir, 'src', 'app.rs'), 'utf8')
      await writeFile(
        join(destinationDir, 'src', 'app.rs'),
        appSrc.replace(/\s*\.merge\(modules::posts::routes::router\(\)\)\n/, '\n'),
      )
    }
    generated.push('src/db/pool.rs (no-db)')
  }

  if (config.rustAuth === 'none') {
    await writeFile(
      join(destinationDir, 'src', 'middleware', 'auth.rs'),
      `//! Auth disabled for this scaffold.\n\nuse axum::http::Request;\nuse uuid::Uuid;\n\n#[derive(Clone, Debug)]\npub struct CurrentUser {\n    pub id: Uuid,\n}\n\npub async fn optional_user<B>(_req: &Request<B>) -> Option<CurrentUser> {\n    None\n}\n`,
    )
  }

  if (config.includeDocker) {
    await writeFile(join(destinationDir, 'Dockerfile'), renderRustDockerfile())
    generated.push('Dockerfile')
    await writeFile(join(destinationDir, 'docker-compose.yml'), renderRustDockerCompose(config))
    generated.push('docker-compose.yml')
  }

  return generated
}

function resolveRustTemplateSource(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [join(here, '../../templates/rust'), join(here, '../../../src/templates/rust')]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  throw new Error('Missing rust template at apps/cli/src/templates/rust')
}

export function renderRustWorkspaceCargoToml(): string {
  return `[workspace]
members = ["services/api"]
resolver = "2"
`
}

/**
 * Copy the module-first Axum template into `services/api` for rust-fullstack presets.
 * Reuses the same transforms as the standalone `rust` family.
 */
export async function applyRustServiceApiScaffold(
  destinationDir: string,
  config: ProjectConfig,
): Promise<void> {
  const apiDir = join(destinationDir, 'services', 'api')
  const templateSource = resolveRustTemplateSource()

  await rm(apiDir, { recursive: true, force: true })
  await cp(templateSource, apiDir, {
    recursive: true,
    filter: (src) => !src.split('/').includes('target'),
  })

  const apiConfig: ProjectConfig = {
    ...config,
    family: 'rust',
    backend: 'rust-axum',
    example: config.database === 'none' ? 'none' : 'posts',
    includeDocker: false,
  }

  await applyRustScaffoldTransform(apiDir, apiConfig)
  await writeFile(join(destinationDir, 'Cargo.toml'), renderRustWorkspaceCargoToml())
  await writeFile(join(apiDir, 'Dockerfile'), renderRustDockerfile())
  await writeFile(join(apiDir, '.env.example'), renderRustEnvExample(apiConfig))
}

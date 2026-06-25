#!/usr/bin/env bun
/**
 * Start local Docker dependencies for monorepo dev.
 *
 * Defaults (override with env):
 *   DOCKER_COMPOSE_POSTGRES — Postgres compose file
 *   DOCKER_COMPOSE_REDIS    — Redis compose file
 *
 * Usage:
 *   bun toolings/scripts/dev-deps.ts           # Postgres only
 *   bun toolings/scripts/dev-deps.ts --redis   # Postgres + Redis
 *   bun toolings/scripts/dev-deps.ts --down    # stop containers
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const home = homedir()
const POSTGRES_COMPOSE =
  process.env.DOCKER_COMPOSE_POSTGRES ??
  join(home, 'Projects/docker-compose/postgres/docker-compose.db.yml')
const REDIS_COMPOSE =
  process.env.DOCKER_COMPOSE_REDIS ?? join(home, 'Projects/docker-compose/redis/docker-compose.yml')

const args = new Set(process.argv.slice(2))
const withRedis = args.has('--redis')
const down = args.has('--down')

function run(subcommand: string, file: string, extra: string[] = []): boolean {
  if (!existsSync(file)) {
    console.error(`[dev:deps] Compose file not found: ${file}`)
    return false
  }
  console.log(`[dev:deps] docker compose -f ${file} ${subcommand} ${extra.join(' ')}`.trim())
  const result = spawnSync('docker', ['compose', '-f', file, subcommand, ...extra], {
    stdio: 'inherit',
  })
  return result.status === 0
}

function waitForPostgres(): void {
  console.log('[dev:deps] Waiting for Postgres…')
  for (let i = 0; i < 30; i++) {
    const probe = spawnSync(
      'docker',
      ['exec', 'postgresdb', 'psql', '-U', 'user', '-d', 'arche_dev', '-c', 'SELECT 1'],
      { stdio: 'pipe' },
    )
    if (probe.status === 0) {
      console.log('[dev:deps] Postgres is ready (arche_dev)')
      return
    }
    Bun.sleepSync(500)
  }
  console.warn('[dev:deps] Postgres may still be starting — check: docker logs postgresdb')
}

if (down) {
  if (withRedis) run('down', REDIS_COMPOSE)
  run('down', POSTGRES_COMPOSE)
  process.exit(0)
}

if (!run('up', POSTGRES_COMPOSE, ['-d'])) process.exit(1)
waitForPostgres()

if (withRedis) {
  if (!run('up', REDIS_COMPOSE, ['-d'])) process.exit(1)
  console.log('[dev:deps] Redis is up (redis://localhost:6379)')
} else {
  console.log('[dev:deps] Skipping Redis (pass --redis if ENABLE_REDIS=true)')
}

console.log('[dev:deps] Done. Next: bun run db:migrate && bun run dev:app')

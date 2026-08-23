#!/usr/bin/env bun
/**
 * Manual-style smoke checks for graduated presets.
 * Scaffolds into a temp dir, runs install/build where applicable, and probes live APIs.
 *
 * Usage:
 *   bun toolings/scripts/smoke-scaffold-manual.ts
 *   bun toolings/scripts/smoke-scaffold-manual.ts --preset=rust-fullstack
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statfsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '@kitsunekode/arche/create'
import { projectDefaultsForPreset } from '@kitsunekode/arche/preset-config'
import type { Preset } from '@kitsunekode/arche/schemas'

const GRADUATED_PRESETS: Preset[] = [
  'typescript-fullstack',
  'rust-fullstack',
  'rust-api',
  'convex-product',
  'solana-program',
]

function parsePresetArg(argv: string[]): Preset[] {
  const presetArg = argv.find((arg) => arg.startsWith('--preset='))
  if (!presetArg) return GRADUATED_PRESETS
  return presetArg
    .slice('--preset='.length)
    .split(',')
    .map((value) => value.trim()) as Preset[]
}

function run(cwd: string, argv: string[], timeoutMs = 300_000): { ok: boolean; output: string } {
  const [command, ...args] = argv
  if (!command) {
    return { ok: false, output: 'Missing command' }
  }

  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024 * 20,
  })
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
  return { ok: result.status === 0 && !result.error, output }
}

function assertFile(path: string, label: string, failures: string[]): void {
  if (!existsSync(path)) failures.push(`missing ${label}: ${path}`)
}

/** Drop stale scaffold dirs when /tmp is tight (Anchor cold builds need several GB). */
function pruneStaleSmokeDirs(): void {
  const tmp = tmpdir()
  let stats: ReturnType<typeof statfsSync>
  try {
    stats = statfsSync(tmp)
  } catch {
    return
  }

  const freeBytes = stats.bavail * stats.bsize
  const freeGb = freeBytes / 1024 ** 3
  if (freeGb >= 4) return

  console.warn(`/tmp low on space (${freeGb.toFixed(1)} GiB free); pruning arche-* dirs`)
  for (const entry of readdirSync(tmp)) {
    if (!entry.startsWith('arche-')) continue
    try {
      rmSync(join(tmp, entry), { recursive: true, force: true })
    } catch {
      // best-effort
    }
  }
}

async function probeRustApi(
  dir: string,
  failures: string[],
  label: string,
  options: { manifestPath?: string; port: string },
): Promise<void> {
  const envPath = join(dir, options.manifestPath ? 'services/api/.env' : '.env')
  if (existsSync(envPath)) {
    const env = readFileSync(envPath, 'utf8')
    const patched = env.replace(
      /DATABASE_URL=.*/,
      'DATABASE_URL=postgres://user:password@localhost:5432/rust_fullstack',
    )
    await Bun.write(envPath, patched)
  }

  const manifestFlag = options.manifestPath ? ['--manifest-path', options.manifestPath] : []
  const build = run(dir, ['cargo', 'build', ...manifestFlag])
  if (!build.ok) failures.push(`${label}: cargo build failed\n${build.output}`)

  const server = Bun.spawn(['cargo', 'run', ...manifestFlag], {
    cwd: dir,
    env: {
      ...process.env,
      PORT: options.port,
      DATABASE_URL: 'postgres://user:password@localhost:5432/rust_fullstack',
    },
    stdout: 'pipe',
    stderr: 'pipe',
  })

  await Bun.sleep(2500)
  try {
    const base = `http://127.0.0.1:${options.port}`
    const health = await fetch(`${base}/health`)
    if (!health.ok) failures.push(`${label}: /health returned ${health.status}`)
    const posts = await fetch(`${base}/posts`)
    if (!posts.ok) failures.push(`${label}: /posts returned ${posts.status}`)
    const create = await fetch(`${base}/posts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer demo' },
      body: JSON.stringify({ title: 'smoke', content: 'manual probe' }),
    })
    if (!create.ok) failures.push(`${label}: POST /posts returned ${create.status}`)
  } catch (error) {
    failures.push(
      `${label}: API probe failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  } finally {
    server.kill()
  }
}

async function scaffoldPreset(preset: Preset, root: string): Promise<string> {
  const destinationDir = join(root, preset)
  const result = await createProject({
    config: {
      projectName: preset,
      destinationDir,
      family: 'fullstack',
      bundles: [],
      packageManager: 'bun',
      database: 'postgres',
      vectorDatabase: 'none',
      orm: 'prisma',
      backend: 'express-bun',
      runtime: 'bun',
      example: 'none',
      testing: 'bun',
      deployment: 'vercel-railway',
      includeShowcase: false,
      includeWorker: false,
      includeLiveDemo: false,
      includeDocker: true,
      includeCi: true,
      initializeGit: false,
      installDependencies: false,
      presets: [],
      rustAuth: 'placeholder',
      preset,
      ...projectDefaultsForPreset(preset),
    },
    dryRun: false,
  })

  if (!result.success) {
    throw new Error(`scaffold failed for ${preset}`)
  }

  return destinationDir
}

async function smokeTypescriptFullstack(dir: string, failures: string[]): Promise<void> {
  assertFile(join(dir, 'AGENTS.md'), 'AGENTS.md', failures)
  assertFile(join(dir, 'arche.json'), 'arche.json', failures)
  assertFile(join(dir, 'apps/web/app/page.tsx'), 'web homepage', failures)

  const install = run(dir, ['bun', 'install'])
  if (!install.ok) failures.push(`typescript-fullstack: bun install failed\n${install.output}`)

  const typecheck = run(dir, ['bun', 'run', 'check-types'])
  if (!typecheck.ok) failures.push(`typescript-fullstack: check-types failed\n${typecheck.output}`)

  const page = readFileSync(join(dir, 'apps/web/app/page.tsx'), 'utf8')
  const trpcStatus = readFileSync(join(dir, 'apps/web/app/trpc-status.tsx'), 'utf8')
  if (
    (!page.includes('helloQueryOptions') && !page.includes('trpc.hello')) ||
    !page.includes('TrpcStatus')
  ) {
    failures.push('typescript-fullstack: web page missing RSC prefetch + TrpcStatus demo')
  }
  if (!trpcStatus.includes('useQuery')) {
    failures.push('typescript-fullstack: trpc-status missing useQuery destructure')
  }
}

async function smokeRustFullstack(dir: string, failures: string[]): Promise<void> {
  assertFile(join(dir, 'services/api/src/app.rs'), 'Axum app.rs', failures)
  assertFile(join(dir, 'apps/web/app/page.tsx'), 'web homepage', failures)

  const install = run(dir, ['bun', 'install'])
  if (!install.ok) failures.push(`rust-fullstack: bun install failed\n${install.output}`)

  const webPage = readFileSync(join(dir, 'apps/web/app/page.tsx'), 'utf8')
  if (!webPage.includes('/posts')) failures.push('rust-fullstack: web page missing posts probe')
  if (webPage.includes('useEffect')) {
    failures.push('rust-fullstack: web page should use useQuery instead of useEffect fetch')
  }
  if (!webPage.includes('useQuery')) {
    failures.push('rust-fullstack: web page missing useQuery probes')
  }

  await probeRustApi(dir, failures, 'rust-fullstack', {
    manifestPath: 'services/api/Cargo.toml',
    port: '3011',
  })
}

async function smokeRustApi(dir: string, failures: string[]): Promise<void> {
  assertFile(join(dir, 'src/app.rs'), 'Axum app.rs', failures)
  const check = run(dir, ['cargo', 'check', '--workspace'])
  if (!check.ok) failures.push(`rust-api: cargo check failed\n${check.output}`)
  await probeRustApi(dir, failures, 'rust-api', { port: '3012' })
}

async function smokeConvex(dir: string, failures: string[]): Promise<void> {
  assertFile(join(dir, 'convex/schema.ts'), 'convex schema', failures)
  const install = run(dir, ['bun', 'install'])
  if (!install.ok) failures.push(`convex-product: bun install failed\n${install.output}`)
  const typecheck = run(dir, ['bun', 'run', 'check-types'])
  if (!typecheck.ok) failures.push(`convex-product: check-types failed\n${typecheck.output}`)
}

async function smokeSolanaProgram(dir: string, failures: string[]): Promise<void> {
  assertFile(join(dir, 'Anchor.toml'), 'Anchor.toml', failures)
  assertFile(join(dir, 'programs/core/src/lib.rs'), 'program lib', failures)
  const install = run(dir, ['bun', 'install'])
  if (!install.ok) failures.push(`solana-program: bun install failed\n${install.output}`)
  if (spawnSync('which', ['anchor']).status === 0) {
    const build = run(dir, ['anchor', 'build'], 600_000)
    if (!build.ok) failures.push(`solana-program: anchor build failed\n${build.output}`)
  }
}

async function main(): Promise<void> {
  pruneStaleSmokeDirs()
  const presets = parsePresetArg(process.argv.slice(2))
  const root = mkdtempSync(join(tmpdir(), 'arche-smoke-manual-'))
  const failures: string[] = []

  console.log(`Smoke workspace: ${root}`)

  try {
    for (const preset of presets) {
      console.log(`\n▶ ${preset}`)
      const dir = await scaffoldPreset(preset, root)

      switch (preset) {
        case 'typescript-fullstack':
          await smokeTypescriptFullstack(dir, failures)
          break
        case 'rust-fullstack':
          await smokeRustFullstack(dir, failures)
          break
        case 'rust-api':
          await smokeRustApi(dir, failures)
          break
        case 'convex-product':
          await smokeConvex(dir, failures)
          break
        case 'solana-program':
          await smokeSolanaProgram(dir, failures)
          break
        default:
          failures.push(`no smoke handler for preset: ${preset}`)
      }

      console.log(failures.some((f) => f.startsWith(preset)) ? `  ✗ issues` : `  ✓ ok`)
    }
  } finally {
    if (!process.argv.includes('--keep')) {
      rmSync(root, { recursive: true, force: true })
    } else {
      console.log(`\nKept output at ${root}`)
    }
  }

  if (failures.length > 0) {
    console.error('\nSmoke failures:')
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }

  console.log('\nAll manual smoke checks passed.')
}

await main()

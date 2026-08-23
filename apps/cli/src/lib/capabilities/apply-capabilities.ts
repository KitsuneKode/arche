import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LIVE_DEMO_MANIFEST } from './manifests'
import type { CapabilityManifest } from './types'

const isBundled =
  typeof __dirname !== 'undefined' && (__dirname.includes('/dist') || !__dirname.includes('/src/'))

function resolveFullstackTemplateRoot(): string {
  const packageDir = resolve(
    typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url)),
    isBundled ? '..' : '../..',
  )
  const candidates = [
    resolve(
      typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url)),
      '../../templates/fullstack',
    ),
    join(packageDir, 'src', 'templates', 'fullstack'),
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  throw new Error('Missing fullstack template at src/templates/fullstack')
}

/**
 * Dual overlay files restored from the minimal fullstack template when live-demo
 * is removed. Must stay in sync with LIVE_DEMO_OVERLAY_PATHS (minus addon-only fragments).
 */
const MINIMAL_OVERLAY_PATHS = [
  'packages/auth/package.json',
  'packages/auth/src/index.ts',
  'packages/auth/src/client.ts',
  'packages/backend-common/src/env.ts',
  'packages/store/prisma/schema.prisma',
  'packages/store/src/scripts/seed.ts',
  'apps/server/src/server.ts',
  'apps/server/src/common/middleware/rate-limit.ts',
  'apps/server/src/modules/common/public-dto.ts',
  'apps/server/src/modules/trpc/app.router.ts',
  'apps/server/src/app.ts',
  'apps/server/src/modules/auth/auth.routes.ts',
  'apps/worker/src/index.ts',
  'apps/worker/src/schedule.ts',
  'apps/worker/src/jobs/cleanup.ts',
  'apps/web/tsconfig.json',
] as const

async function pathExists(filePath: string): Promise<boolean> {
  try {
    const { stat } = await import('node:fs/promises')
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

async function removePaths(destinationDir: string, paths: string[]): Promise<string[]> {
  const removed: string[] = []
  for (const relativePath of paths) {
    const fullPath = join(destinationDir, relativePath)
    if (!(await pathExists(fullPath))) {
      continue
    }
    await rm(fullPath, { recursive: true, force: true })
    removed.push(relativePath)
  }
  return removed
}

async function patchHomepageLiveCta(destinationDir: string): Promise<string | null> {
  const homePage = join(destinationDir, 'apps/web/app/page.tsx')
  try {
    const content = await readFile(homePage, 'utf8')
    const withoutLiveCta = content
      .replace(/\s*<Link href="\/live"[^>]*>[\s\S]*?<\/Link>\s*/g, '\n')
      .replace(/import Link from 'next\/link'\n/, '')
    if (withoutLiveCta !== content) {
      await writeFile(homePage, withoutLiveCta)
      return 'apps/web/app/page.tsx (live CTA removed)'
    }
  } catch {
    // homepage not present
  }
  return null
}

async function patchNextConfigPlayRedirect(destinationDir: string): Promise<string | null> {
  const configPath = join(destinationDir, 'apps/web/next.config.js')
  try {
    const content = await readFile(configPath, 'utf8')
    const patched = content
      .replace(/\s*{\s*source:\s*'\/play'[\s\S]*?},\n?/g, '\n')
      .replace(/\n\s*\/\/ Live demo redirect[\s\S]*?\n/g, '\n')
    if (patched !== content) {
      await writeFile(configPath, patched)
      return 'apps/web/next.config.js (play redirect removed)'
    }
  } catch {
    // config not present
  }
  return null
}

async function patchEnvExampleForLiveDemoRemoval(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const patched: string[] = []
  for (const relative of [
    `${serverDir}/.env.example`,
    'packages/backend-common/.env.example',
    '.env.example',
  ]) {
    const fullPath = join(destinationDir, relative)
    try {
      const content = await readFile(fullPath, 'utf8')
      const next = content
        .replace(/^DEMO_AUTO_SIGN_IN=.*\n?/gm, '')
        .replace(/^NEXT_PUBLIC_ENABLE_CHAT_SSE=.*\n?/gm, '')
        .replace(/^LATTICE_ROUND_ENGINE=.*\n?/gm, '')
      if (next !== content) {
        await writeFile(fullPath, next)
        patched.push(relative)
      }
    } catch {
      // optional
    }
  }
  return patched
}

/**
 * Restore minimal dual-overlay files from the shipped fullstack template.
 * Skips auth/schema when the destination already uses Drizzle.
 */
async function restoreMinimalOverlays(destinationDir: string): Promise<string[]> {
  const templateRoot = resolveFullstackTemplateRoot()
  const restored: string[] = []

  let skipAuth = false
  let skipPrismaSchema = false
  try {
    const authContent = await readFile(join(destinationDir, 'packages/auth/src/index.ts'), 'utf8')
    skipAuth = authContent.includes('drizzleAdapter')
  } catch {
    // auth missing
  }
  try {
    const schemaContent = await readFile(
      join(destinationDir, 'packages/store/prisma/schema.prisma'),
      'utf8',
    )
    // If there is no prisma schema (drizzle-only), skip
    skipPrismaSchema = false
    void schemaContent
  } catch {
    skipPrismaSchema = true
  }

  for (const relative of MINIMAL_OVERLAY_PATHS) {
    if (skipAuth && relative.startsWith('packages/auth/')) continue
    if (skipPrismaSchema && relative === 'packages/store/prisma/schema.prisma') continue

    const source = join(templateRoot, relative)
    if (!existsSync(source)) continue
    const dest = join(destinationDir, relative)
    if (!(await pathExists(dirname(dest))) && !(await pathExists(dirname(dirname(dest))))) {
      // only restore when the parent package/app already exists in the scaffold
      const top = relative.split('/').slice(0, 2).join('/')
      if (!(await pathExists(join(destinationDir, top)))) continue
    }
    await mkdir(dirname(dest), { recursive: true })
    await cp(source, dest, { recursive: true, force: true })
    restored.push(relative)
  }
  return restored
}

/** Content-driven live-demo patches shared by scaffold cleanup and alternate backends. */
export async function applyLiveDemoContentPatches(
  destinationDir: string,
  serverDir = 'apps/server',
): Promise<string[]> {
  const patched: string[] = []
  const homepagePatch = await patchHomepageLiveCta(destinationDir)
  if (homepagePatch) patched.push(homepagePatch)
  const redirectPatch = await patchNextConfigPlayRedirect(destinationDir)
  if (redirectPatch) patched.push(redirectPatch)
  patched.push(...(await patchEnvExampleForLiveDemoRemoval(destinationDir, serverDir)))
  patched.push(...(await restoreMinimalOverlays(destinationDir)))
  return patched
}

/** Remove live-demo paths only (no auth/schema/router patches). For alternate stacks after transforms. */
export async function removeLiveDemoPathsOnly(destinationDir: string): Promise<string[]> {
  return removePaths(destinationDir, LIVE_DEMO_MANIFEST.removePaths)
}

/** Remove live-demo capability files and patch core modules for a minimal scaffold. */
export async function applyLiveDemoRemoval(destinationDir: string): Promise<string[]> {
  const removed = await removePaths(destinationDir, LIVE_DEMO_MANIFEST.removePaths)
  removed.push(...(await applyLiveDemoContentPatches(destinationDir)))
  return removed
}

/** Apply a capability manifest removal (paths only — use specialized helpers for live-demo). */
export async function applyCapabilityRemoval(
  destinationDir: string,
  manifest: CapabilityManifest,
): Promise<string[]> {
  if (manifest.id === 'live-demo') {
    return applyLiveDemoRemoval(destinationDir)
  }
  return removePaths(destinationDir, manifest.removePaths)
}

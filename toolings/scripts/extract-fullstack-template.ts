#!/usr/bin/env bun
/**
 * Extract live dogfood → fullstack template + live-demo addon.
 *
 * Live apps/packages are canonical for shared runtime code. Templates are derived:
 * - Addon: live-demo modules/components + dual overlays from live
 * - Fullstack core: allowlisted files synced from live (package.json catalog: → pins)
 *
 * Dual overlay fixtures stay minimal under templates/fullstack (not overwritten from live).
 * Dogfood-only route shells stay local under the addon (not overwritten from live).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import workspaceCatalog from '../catalog/workspace-catalog.json' with { type: 'json' }

const ROOT = resolve(import.meta.dir, '../..')
const TEMPLATE = join(ROOT, 'apps/cli/src/templates/fullstack')
const ADDON = join(ROOT, 'apps/cli/src/templates/addons/live-demo')

/** Live-demo-only paths copied live → addon. */
export const LIVE_DEMO_ADDON_PATHS = [
  'apps/web/app/live',
  'apps/web/app/(sandbox)',
  'apps/web/app/(auth)',
  'apps/web/components/live',
  'apps/web/components/play',
  'apps/web/components/sandbox',
  'apps/web/lib/live-feed',
  'apps/web/lib/live-chat-sync.ts',
  'apps/web/lib/live-chat-sync-policy.ts',
  'apps/web/lib/proof-run',
  'apps/web/lib/proof-run-storage.ts',
  'apps/web/lib/client-mounted.ts',
  'apps/web/lib/api-health.ts',
  'apps/web/lib/use-api-reachable.ts',
  'apps/web/lib/use-online-status.ts',
  'apps/web/lib/ensure-guest-session.ts',
  'apps/web/lib/guest-session.ts',
  'apps/web/lib/relay-run',
  'apps/web/lib/og/routes/live-opengraph.meta.ts',
  'apps/web/lib/og/routes/live-opengraph.image.tsx',
  'apps/web/lib/live-tab.ts',
  'apps/web/lib/live-tab.test.ts',
  'apps/web/lib/use-bootstrap-guest-session.ts',
  'apps/web/lib/chat-display.ts',
  'apps/web/lib/chat-display.test.ts',
  'apps/web/content/docs/guides/live-demo.mdx',
  'apps/web/content/docs/operations/security.mdx',
  'apps/server/src/modules/live',
  'apps/server/src/modules/lattice',
  'apps/server/src/modules/chat',
  'apps/server/src/modules/game',
  'apps/server/src/modules/demo',
  'packages/backend-common/src/demo-policy.ts',
  'packages/backend-common/src/live',
  'packages/auth/src/guest-display-name.ts',
  'packages/auth/src/guest-display-name.test.ts',
  'packages/auth/src/migrate-guest-data.ts',
  'packages/auth/src/migrate-guest-data.test.ts',
  'packages/store/prisma/migrations/20260625140000_relay_run_score',
  'packages/store/prisma/migrations/20260625150000_user_is_anonymous',
  'packages/store/prisma/migrations/20260625050000_relay_lattice',
  'packages/store/prisma/migrations/20260625120000_lattice_single_open_round',
  'packages/ui',
] as const

/** Dual files: live copy → addon; fullstack keeps minimal fixtures. */
export const LIVE_DEMO_OVERLAY_PATHS = [
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

/** Addon-only fragments (not in live). */
const ADDON_ONLY_FRAGMENTS = [
  'packages/backend-common/package.exports.live-demo.json',
  'apps/web/package.deps.live-demo.json',
] as const

/**
 * Dogfood route shells that import marketing/SEO — keep addon-local versions.
 * Relative to addon root; prefix match.
 */
export const ADDON_DIVERGENT_KEEP = [
  'apps/web/app/(sandbox)/live/page.tsx',
  'apps/web/app/(sandbox)/layout.tsx',
  'apps/web/app/(auth)/layout.tsx',
  'apps/web/app/(auth)/sign-in/page.tsx',
  'apps/web/app/(auth)/sign-up/page.tsx',
] as const

/**
 * Fullstack core files synced live → template.
 * Only paths that should match dogfood runtime (no marketing, no live-demo duals).
 */
export const CORE_SYNC_PATHS = [
  'apps/server/src/modules/post',
  'apps/server/src/modules/user',
  'apps/server/src/modules/health',
  'apps/server/src/modules/admin',
  'apps/server/src/modules/root',
  'apps/server/src/modules/common/trpc-errors.ts',
  'apps/server/src/modules/trpc/trpc.ts',
  'apps/server/src/modules/trpc/index.ts',
  'apps/server/src/modules/trpc/trpc.routes.ts',
  'apps/server/src/modules/auth/auth.trpc.ts',
  'apps/server/src/common/env.ts',
  'apps/server/src/common/errors.ts',
  'apps/server/src/common/logger.ts',
  'apps/server/src/common/validate.ts',
  'apps/server/src/common/middleware/async-handler.ts',
  'apps/server/src/common/middleware/cache.ts',
  'apps/server/src/common/middleware/error-handler.ts',
  'apps/server/src/common/middleware/security-headers.ts',
  'apps/server/src/common/middleware/timing.ts',
  'apps/server/src/common/middleware/tracing.ts',
  'apps/server/src/db',
  'apps/server/src/vercel-handler.ts',
  'apps/worker/src/jobs/email.ts',
  'apps/worker/src/jobs/webhook.ts',
  'apps/worker/src/jobs/index.ts',
  'apps/worker/src/queue.ts',
  'apps/worker/src/redis',
  'apps/worker/src/utils',
  'apps/worker/tsconfig.json',
  'packages/common/src',
  'packages/trpc/src',
  'toolings/typescript-config/base.json',
  'toolings/typescript-config/backend.json',
  'toolings/typescript-config/nextjs.json',
  'toolings/typescript-config/react-library.json',
] as const

const IGNORE_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'build',
  'out',
  'generated',
])

type Catalog = Record<string, string>

function isIgnoredRel(rel: string): boolean {
  return rel.split('/').some((segment) => IGNORE_DIR_NAMES.has(segment))
}

function listFilesRecursive(base: string, prefix = ''): string[] {
  if (!existsSync(base)) return []
  const out: string[] = []
  for (const entry of readdirSync(base)) {
    const rel = prefix ? `${prefix}/${entry}` : entry
    if (isIgnoredRel(rel)) continue
    const full = join(base, entry)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...listFilesRecursive(full, rel))
    else out.push(rel)
  }
  return out
}

function expandToFiles(root: string, relativePath: string): string[] {
  const full = join(root, relativePath)
  if (!existsSync(full)) return []
  const st = statSync(full)
  if (st.isFile()) return [relativePath]
  return listFilesRecursive(full).map((f) => `${relativePath}/${f}`)
}

function pinCatalogDeps(raw: string, catalog: Catalog): string {
  let pkg: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }
  try {
    pkg = JSON.parse(raw) as typeof pkg
  } catch {
    return raw
  }
  for (const group of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]) {
    if (!group) continue
    for (const [name, value] of Object.entries(group)) {
      if (value !== 'catalog:') continue
      const pin = catalog[name]
      if (pin) group[name] = pin
    }
  }
  return `${JSON.stringify(pkg, null, 2)}\n`
}

function shouldKeepAddonLocal(relativePath: string): boolean {
  return ADDON_DIVERGENT_KEEP.some(
    (keep) => relativePath === keep || relativePath.startsWith(`${keep}/`),
  )
}

function writeFileFromLive(
  relativePath: string,
  destRoot: string,
  options: { pinJson: boolean },
): boolean {
  const source = join(ROOT, relativePath)
  if (!existsSync(source) || !statSync(source).isFile()) return false
  const dest = join(destRoot, relativePath)
  mkdirSync(dirname(dest), { recursive: true })
  const content = readFileSync(source)
  if (options.pinJson && relativePath.endsWith('package.json')) {
    writeFileSync(dest, pinCatalogDeps(content.toString('utf8'), workspaceCatalog as Catalog))
  } else {
    writeFileSync(dest, content)
  }
  return true
}

function buffersEqual(a: Buffer, b: Buffer): boolean {
  return a.equals(b)
}

export interface ExtractResult {
  addonWritten: string[]
  coreWritten: string[]
  addonDrift: string[]
  coreDrift: string[]
  skippedMissing: string[]
}

export function extractTemplates(options: { check: boolean }): ExtractResult {
  const result: ExtractResult = {
    addonWritten: [],
    coreWritten: [],
    addonDrift: [],
    coreDrift: [],
    skippedMissing: [],
  }

  // --- Addon: expand paths to files, skip divergent dogfood shells ---
  const addonFileSet = new Set<string>()
  for (const path of [...LIVE_DEMO_ADDON_PATHS, ...LIVE_DEMO_OVERLAY_PATHS]) {
    for (const file of expandToFiles(ROOT, path)) {
      if (!shouldKeepAddonLocal(file)) addonFileSet.add(file)
    }
  }

  for (const relativePath of [...addonFileSet].sort()) {
    const livePath = join(ROOT, relativePath)
    const destPath = join(ADDON, relativePath)
    if (!existsSync(livePath)) {
      result.skippedMissing.push(`addon:${relativePath}`)
      continue
    }

    if (options.check) {
      if (!existsSync(destPath) || !buffersEqual(readFileSync(livePath), readFileSync(destPath))) {
        result.addonDrift.push(relativePath)
      }
      continue
    }

    if (writeFileFromLive(relativePath, ADDON, { pinJson: false })) {
      result.addonWritten.push(relativePath)
    }
  }

  for (const fragment of ADDON_ONLY_FRAGMENTS) {
    if (!existsSync(join(ADDON, fragment))) {
      result.skippedMissing.push(`addon-only-missing:${fragment}`)
    }
  }

  // --- Core allowlist sync ---
  const coreFileSet = new Set<string>()
  for (const path of CORE_SYNC_PATHS) {
    for (const file of expandToFiles(ROOT, path)) {
      // Only sync if the template already owns this file (never invent marketing paths)
      if (existsSync(join(TEMPLATE, file))) coreFileSet.add(file)
    }
  }

  for (const relativePath of [...coreFileSet].sort()) {
    const livePath = join(ROOT, relativePath)
    const templatePath = join(TEMPLATE, relativePath)
    const liveBuf = readFileSync(livePath)
    const expected = relativePath.endsWith('package.json')
      ? Buffer.from(pinCatalogDeps(liveBuf.toString('utf8'), workspaceCatalog as Catalog))
      : liveBuf
    const current = readFileSync(templatePath)

    if (options.check) {
      if (!buffersEqual(current, expected)) result.coreDrift.push(relativePath)
      continue
    }

    if (!buffersEqual(current, expected)) {
      writeFileSync(templatePath, expected)
      result.coreWritten.push(relativePath)
    }
  }

  return result
}

function main(): void {
  const check = process.argv.includes('--check')
  const result = extractTemplates({ check })

  if (check) {
    const errors = [
      ...result.addonDrift.map((p) => `addon drift: ${p}`),
      ...result.coreDrift.map((p) => `core drift: ${p}`),
      ...result.skippedMissing.filter((s) => s.startsWith('addon-only-missing:')).map((s) => s),
    ]
    if (errors.length > 0) {
      console.error('template extract check failed:\n' + errors.map((e) => `  - ${e}`).join('\n'))
      process.exit(1)
    }
    console.log('template extract: live → fullstack + live-demo OK')
    return
  }

  console.log(
    `template extract wrote ${result.addonWritten.length} addon file(s), ${result.coreWritten.length} core file(s)`,
  )
  if (result.skippedMissing.length > 0) {
    console.warn('notes:\n' + result.skippedMissing.map((s) => `  - ${s}`).join('\n'))
  }
}

if (import.meta.main) {
  main()
}

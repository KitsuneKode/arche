#!/usr/bin/env bun
/**
 * Verify the fullstack scaffold template stays minimal and the live-demo addon stays complete.
 * Does not sync dogfood marketing — only checks owned scaffold paths.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '../..')
const TEMPLATE = join(ROOT, 'apps/cli/src/templates/fullstack')
const ADDON = join(ROOT, 'apps/cli/src/templates/addons/live-demo')

const TEMPLATE_MUST_NOT_HAVE = [
  'apps/web/components/live',
  'apps/web/app/(sandbox)',
  'apps/server/src/modules/game',
  'apps/server/src/modules/chat',
  'apps/server/src/modules/live',
  'apps/server/src/modules/lattice',
  'apps/server/src/modules/demo',
  'packages/auth/src/migrate-guest-data.ts',
  'packages/auth/src/guest-display-name.ts',
  'packages/store/prisma/migrations/20260625050000_relay_lattice',
  'packages/store/prisma/migrations/20260625120000_lattice_single_open_round',
]

const ADDON_MUST_HAVE = [
  'apps/web/components/live/live-demo.tsx',
  'apps/web/app/(sandbox)/live/page.tsx',
  'apps/server/src/modules/game/game.trpc.ts',
  'packages/store/prisma/schema.prisma',
  'packages/auth/package.json',
  'packages/backend-common/package.exports.live-demo.json',
  'packages/backend-common/src/demo-policy.ts',
  'packages/ui/package.json',
  'packages/store/src/scripts/seed.ts',
  'apps/worker/src/jobs/cleanup.ts',
  'packages/store/prisma/migrations/20260625050000_relay_lattice',
  'packages/store/prisma/migrations/20260625120000_lattice_single_open_round',
]

function readIfExists(path: string): string | null {
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}

function checkTemplateInvariants(): string[] {
  const errors: string[] = []

  const publicDto = readIfExists(join(TEMPLATE, 'apps/server/src/modules/common/public-dto.ts'))
  if (publicDto?.includes('@arche-template/auth/guest-display-name')) {
    errors.push('template: public-dto.ts must not import guest-display-name')
  }
  if (publicDto?.includes('toPublicMessage')) {
    errors.push('template: public-dto.ts must not export toPublicMessage')
  }

  const authRoutes = readIfExists(join(TEMPLATE, 'apps/server/src/modules/auth/auth.routes.ts'))
  if (authRoutes?.includes('/sign-in/anonymous')) {
    errors.push('template: auth.routes.ts must not expose anonymous sign-in')
  }

  const serverTs = readIfExists(join(TEMPLATE, 'apps/server/src/server.ts'))
  if (serverTs?.includes('LATTICE_ROUND_ENGINE')) {
    errors.push('template: server.ts must not bootstrap lattice engine')
  }

  const envTs = readIfExists(join(TEMPLATE, 'packages/backend-common/src/env.ts'))
  if (envTs?.includes('DEMO_AUTO_SIGN_IN')) {
    errors.push('template: env.ts must not define DEMO_AUTO_SIGN_IN')
  }

  const rateLimit = readIfExists(join(TEMPLATE, 'apps/server/src/common/middleware/rate-limit.ts'))
  if (
    rateLimit?.includes('anonymousSignInRateLimit') ||
    rateLimit?.includes('chatStreamRateLimit')
  ) {
    errors.push('template: rate-limit.ts must not export live-demo rate limits')
  }

  const workerIndex = readIfExists(join(TEMPLATE, 'apps/worker/src/index.ts'))
  if (workerIndex?.includes('ensureCleanupSchedule')) {
    errors.push('template: apps/worker/src/index.ts must use registerSchedules')
  }

  const seed = readIfExists(join(TEMPLATE, 'packages/store/src/scripts/seed.ts'))
  if (seed?.includes('latticeCell') || seed?.includes('prisma.message')) {
    errors.push('template: seed.ts must not reference live-demo-only models')
  }

  const workerCleanup = readIfExists(join(TEMPLATE, 'apps/worker/src/jobs/cleanup.ts'))
  if (workerCleanup?.includes('deleteStaleAnonymousUsers')) {
    errors.push('template: worker cleanup must not depend on guest auth')
  }

  return errors
}

function checkAddonInvariants(): string[] {
  const errors: string[] = []

  const livePage = readIfExists(join(ADDON, 'apps/web/app/(sandbox)/live/page.tsx'))
  if (!livePage) {
    errors.push('addon: missing live page')
  } else {
    if (livePage.includes('@/components/arche/')) {
      errors.push('addon: live page must not import dogfood arche components')
    }
    if (livePage.includes('live-demo-json-ld') || livePage.includes('@/lib/seo')) {
      errors.push('addon: live page must not import dogfood SEO helpers')
    }
  }

  const authPkg = readIfExists(join(ADDON, 'packages/auth/package.json'))
  if (authPkg && !authPkg.includes('guest-display-name')) {
    errors.push('addon: packages/auth/package.json must export guest-display-name')
  }

  const backendExports = readIfExists(
    join(ADDON, 'packages/backend-common/package.exports.live-demo.json'),
  )
  if (backendExports && !backendExports.includes('demo-policy')) {
    errors.push('addon: package.exports.live-demo.json must export demo-policy')
  }

  const addonSeed = readIfExists(join(ADDON, 'packages/store/src/scripts/seed.ts'))
  if (addonSeed && !addonSeed.includes('latticeCell')) {
    errors.push('addon: seed.ts must seed lattice demo data')
  }

  return errors
}

function checkPaths(label: string, base: string, paths: string[], shouldExist: boolean): string[] {
  const errors: string[] = []
  for (const relative of paths) {
    const exists = existsSync(join(base, relative))
    if (shouldExist && !exists) {
      errors.push(`${label}: missing ${relative}`)
    }
    if (!shouldExist && exists) {
      errors.push(`${label}: should not have ${relative}`)
    }
  }
  return errors
}

const check = process.argv.includes('--check')
const errors = [
  ...checkPaths('template', TEMPLATE, TEMPLATE_MUST_NOT_HAVE, false),
  ...checkPaths('addon', ADDON, ADDON_MUST_HAVE, true),
  ...checkTemplateInvariants(),
  ...checkAddonInvariants(),
]

if (errors.length > 0) {
  console.error('template sync check failed:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}

if (check) {
  console.log('template sync: fullstack minimal + live-demo addon OK')
} else {
  console.log('template sync: nothing to write (check-only script)')
}

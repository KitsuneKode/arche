import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '../../..')
const TEMPLATE = join(ROOT, 'apps/cli/src/templates/fullstack')
const ADDON = join(ROOT, 'apps/cli/src/templates/addons/live-demo')

/** Paths that must exist in the live-demo addon, not the default fullstack template. */
const ADDON_REQUIRED_PATHS = [
  'apps/web/components/live/live-demo.tsx',
  'apps/web/components/live/relay-run-game.tsx',
  'apps/web/lib/relay-run/engine.ts',
  'apps/web/app/(sandbox)/live/page.tsx',
  'apps/server/src/modules/game/game.trpc.ts',
  'apps/server/src/modules/chat/chat.trpc.ts',
  'apps/server/src/modules/live/live.routes.ts',
  'packages/auth/src/guest-display-name.ts',
  'packages/auth/package.json',
  'packages/backend-common/package.exports.live-demo.json',
  'packages/backend-common/src/demo-policy.ts',
  'packages/ui/package.json',
  'packages/store/src/scripts/seed.ts',
  'packages/store/prisma/migrations/20260625150000_user_is_anonymous/migration.sql',
  'packages/store/prisma/migrations/20260625050000_relay_lattice/migration.sql',
]

const TEMPLATE_FORBIDDEN_PATHS = [
  'apps/web/components/live',
  'apps/web/app/(sandbox)/live',
  'apps/server/src/modules/game',
  'apps/server/src/modules/chat',
  'apps/server/src/modules/live',
  'packages/auth/src/guest-display-name.ts',
  'packages/store/prisma/migrations/20260625050000_relay_lattice',
]

describe('live-demo addon parity', () => {
  for (const relative of ADDON_REQUIRED_PATHS) {
    it(`addon includes ${relative}`, () => {
      expect(existsSync(join(ADDON, relative))).toBe(true)
    })
  }

  for (const relative of TEMPLATE_FORBIDDEN_PATHS) {
    it(`default template omits ${relative}`, () => {
      expect(existsSync(join(TEMPLATE, relative))).toBe(false)
    })
  }

  it('addon live page is self-contained (no dogfood marketing imports)', () => {
    const livePage = readFileSync(join(ADDON, 'apps/web/app/(sandbox)/live/page.tsx'), 'utf8')
    expect(livePage).not.toContain('@/components/arche/')
    expect(livePage).not.toContain('live-demo-json-ld')
    expect(livePage).not.toContain('@/lib/seo')
    expect(livePage).toContain('LiveDemo')
  })

  it('addon auth package exports guest-display-name subpath', () => {
    const authPkg = readFileSync(join(ADDON, 'packages/auth/package.json'), 'utf8')
    expect(authPkg).toContain('guest-display-name')
  })
})

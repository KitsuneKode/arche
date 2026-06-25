import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '../../..')
const TEMPLATE = join(ROOT, 'apps/cli/src/templates/fullstack')

/** Monorepo root bun test must not discover template copies (no react in install graph). */
const FORBIDDEN_TEMPLATE_WEB_TESTS = [
  'apps/web/app/live-seo.test.ts',
  'apps/web/lib/client-mounted.test.ts',
  'apps/web/lib/live-chat-sync.test.ts',
  'apps/web/lib/proof-run-storage.test.ts',
  'apps/web/lib/live-feed/live-feed.test.ts',
  'apps/web/lib/proof-run/proof-run.test.ts',
  'apps/web/lib/relay-run/engine.test.ts',
]

const FORBIDDEN_TEMPLATE_PATHS = [
  'apps/web/app/live/page.tsx',
  'apps/web/app/live/layout.tsx',
  'apps/web/app/(sandbox)/play',
  'apps/web/components/play',
]

const REQUIRED_PATHS = [
  'apps/web/components/live/live-demo.tsx',
  'apps/web/components/live/live-demo-footer.tsx',
  'apps/web/components/live/live-room-context.tsx',
  'apps/web/components/live/live-panel-shell.tsx',
  'apps/web/components/live/relay-run-game.tsx',
  'apps/web/components/live/relay-chat-panel.tsx',
  'apps/web/components/live/relay-chat-popup.tsx',
  'apps/web/components/live/lattice/relay-chat-sidebar.tsx',
  'apps/web/components/live/activity-deck.tsx',
  'apps/web/components/live/live-chat.tsx',
  'apps/web/lib/live-feed/live-feed.ts',
  'apps/web/lib/relay-run/engine.ts',
  'apps/web/lib/proof-run/proof-run.ts',
  'apps/web/app/(sandbox)/live/page.tsx',
  'apps/web/app/(sandbox)/layout.tsx',
  'apps/web/lib/api-health.ts',
  'apps/server/src/modules/chat/chat.routes.ts',
  'apps/server/src/modules/chat/chat.events.ts',
  'apps/server/src/modules/live/live.routes.ts',
  'apps/server/src/modules/game/game.trpc.ts',
  'apps/server/src/modules/demo/demo.trpc.ts',
  'packages/backend-common/src/demo-policy.ts',
  'packages/store/prisma/migrations/20260625140000_relay_run_score/migration.sql',
]

describe('fullstack template live demo parity', () => {
  for (const relative of REQUIRED_PATHS) {
    it(`includes ${relative}`, () => {
      expect(existsSync(join(TEMPLATE, relative))).toBe(true)
    })
  }

  for (const relative of FORBIDDEN_TEMPLATE_PATHS) {
    it(`does not include legacy ${relative}`, () => {
      expect(existsSync(join(TEMPLATE, relative))).toBe(false)
    })
  }

  for (const relative of FORBIDDEN_TEMPLATE_WEB_TESTS) {
    it(`does not duplicate monorepo test ${relative}`, () => {
      expect(existsSync(join(TEMPLATE, relative))).toBe(false)
    })
  }

  it('(sandbox)/live page does not use server health await or apiReachable prop', () => {
    const source = readFileSync(join(TEMPLATE, 'apps/web/app/(sandbox)/live/page.tsx'), 'utf8')
    expect(source).not.toContain('isApiReachable')
    expect(source).not.toContain('apiReachable')
  })
})

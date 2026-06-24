import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '../../..')
const TEMPLATE = join(ROOT, 'apps/cli/src/templates/fullstack')

const REQUIRED_PATHS = [
  'apps/web/components/live/live-demo.tsx',
  'apps/web/components/live/activity-deck.tsx',
  'apps/web/components/live/live-chat.tsx',
  'apps/web/lib/live-feed/live-feed.ts',
  'apps/web/lib/proof-run/proof-run.ts',
  'apps/web/app/live/page.tsx',
  'apps/server/src/modules/chat/chat.routes.ts',
  'apps/server/src/modules/chat/chat.events.ts',
  'apps/server/src/modules/demo/demo.trpc.ts',
  'packages/backend-common/src/demo-policy.ts',
]

describe('fullstack template live demo parity', () => {
  for (const relative of REQUIRED_PATHS) {
    it(`includes ${relative}`, () => {
      expect(existsSync(join(TEMPLATE, relative))).toBe(true)
    })
  }
})

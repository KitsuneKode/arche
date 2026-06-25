import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyLiveDemoAddon, applyLiveDemoRemoval } from '../src/lib/capabilities'

const ROOT = join(import.meta.dir, '..')
const FULLSTACK_TEMPLATE = join(ROOT, 'src/templates/fullstack')
const LIVE_DEMO_ADDON = join(ROOT, 'src/templates/addons/live-demo')

describe('live-demo capability', () => {
  it('fullstack template is minimal (no /live route)', () => {
    expect(existsSync(join(FULLSTACK_TEMPLATE, 'apps/web/app/(sandbox)/live'))).toBe(false)
    expect(existsSync(join(FULLSTACK_TEMPLATE, 'apps/web/components/live'))).toBe(false)
    expect(existsSync(join(FULLSTACK_TEMPLATE, 'apps/server/src/modules/game'))).toBe(false)
  })

  it('live-demo addon includes core demo paths', () => {
    expect(existsSync(join(LIVE_DEMO_ADDON, 'apps/web/components/live/live-demo.tsx'))).toBe(true)
    expect(existsSync(join(LIVE_DEMO_ADDON, 'apps/web/app/(sandbox)/live/page.tsx'))).toBe(true)
    expect(existsSync(join(LIVE_DEMO_ADDON, 'apps/server/src/modules/game/game.trpc.ts'))).toBe(
      true,
    )
  })

  it('applyLiveDemoAddon restores demo on a minimal copy', async () => {
    const dest = await mkdtemp(join(tmpdir(), 'arche-cap-'))
    try {
      await cp(FULLSTACK_TEMPLATE, dest, { recursive: true })
      const added = await applyLiveDemoAddon(dest)
      expect(added.length).toBeGreaterThan(0)
      expect(existsSync(join(dest, 'apps/web/components/live/live-demo.tsx'))).toBe(true)
      expect(existsSync(join(dest, 'apps/server/src/modules/game'))).toBe(true)
    } finally {
      await rm(dest, { recursive: true, force: true })
    }
  })

  it('applyLiveDemoRemoval strips demo from a copy with addon applied', async () => {
    const dest = await mkdtemp(join(tmpdir(), 'arche-cap-'))
    try {
      await cp(FULLSTACK_TEMPLATE, dest, { recursive: true })
      await applyLiveDemoAddon(dest)
      await applyLiveDemoRemoval(dest)
      expect(existsSync(join(dest, 'apps/web/components/live'))).toBe(false)
      expect(existsSync(join(dest, 'apps/server/src/modules/game'))).toBe(false)

      const workerIndex = await readFile(join(dest, 'apps/worker/src/index.ts'), 'utf8')
      expect(workerIndex).toContain('registerSchedules')
      expect(workerIndex).not.toContain('ensureCleanupSchedule')

      const cleanup = await readFile(join(dest, 'apps/worker/src/jobs/cleanup.ts'), 'utf8')
      expect(cleanup).not.toContain('deleteStaleAnonymousUsers')
    } finally {
      await rm(dest, { recursive: true, force: true })
    }
  })

  it('applyLiveDemoRemoval is a no-op patch on an already-minimal template', async () => {
    const dest = await mkdtemp(join(tmpdir(), 'arche-cap-min-'))
    try {
      await cp(FULLSTACK_TEMPLATE, dest, { recursive: true })
      const authBefore = await readFile(join(dest, 'packages/auth/src/index.ts'), 'utf8')
      await applyLiveDemoRemoval(dest)
      const authAfter = await readFile(join(dest, 'packages/auth/src/index.ts'), 'utf8')
      expect(authAfter).toBe(authBefore)
    } finally {
      await rm(dest, { recursive: true, force: true })
    }
  })
})

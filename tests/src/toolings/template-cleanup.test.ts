import { describe, expect, it } from 'bun:test'
import { buildCleanupPlan } from '../../../toolings/scripts/template-cleanup'

describe('template-cleanup', () => {
  it('plans a starter seed replacement when requested', async () => {
    const actions = await buildCleanupPlan(['seed'])
    // The seed write action should be first, followed by doc cleanup actions
    expect(actions[0]?.type).toBe('write')
    expect(actions[0]?.path).toBe('packages/store/src/scripts/seed.ts')
  })

  it('always appends doc cleanup actions', async () => {
    const actions = await buildCleanupPlan(['seed'])
    const paths = actions.map((action) => action.path)
    // CLI-only docs should be removed in every plan
    expect(paths).toContain('docs/cli-development.md')
    expect(paths).toContain('docs/archive')
    // Agent and architecture docs should be rewritten
    expect(paths).toContain('AGENTS.md')
    expect(paths).toContain('CLAUDE.md')
    expect(paths).toContain('docs/README.md')
    expect(paths).toContain('docs/architecture.md')
  })

  it('includes showcase cleanup writes in the recommended web reset', async () => {
    const actions = await buildCleanupPlan(['showcase'])
    const paths = actions.map((action) => action.path)
    expect(paths).toContain('apps/web/app/layout.tsx')
    expect(paths).toContain('apps/web/app/page.tsx')
    expect(paths).toContain('apps/web/components/landing')
    // Showcase removal also rewrites the web AGENTS.md
    expect(paths).toContain('apps/web/AGENTS.md')
  })

  it('plans live demo removal when requested', async () => {
    const actions = await buildCleanupPlan(['live'])
    const paths = actions.map((action) => action.path)
    expect(paths).toContain('(live-demo manifest)')
  })
})

import { describe, expect, it } from 'bun:test'
import { buildGeneratedArchitectureMd, buildRootAgentsMd } from '../src/lib/generators/agent-docs'
import { renderInternalDocsIndex, renderPlansIndex } from '../src/render/docs/agent-context'
import type { ProjectConfig } from '../src/types/schemas'

function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'acme',
    destinationDir: '/tmp/acme',
    family: 'fullstack',
    bundles: ['product'],
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
    includeDocker: true,
    includeCi: true,
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
    ...overrides,
  }
}

describe('agent context renderers', () => {
  it('renders family-aware AGENTS.md with loading rules', () => {
    const content = buildRootAgentsMd(makeConfig())
    expect(content).toContain('# acme')
    expect(content).toContain('## Loading order')
    expect(content).toContain('docs/README.md')
    expect(content).toContain('.plans/active')
    expect(content).toContain('`apps/server`')
    expect(content).not.toContain('packages/ui')
    expect(content).toContain('duplicate instruction directories')
  })

  it('renders internal docs index with only scaffolded sections', () => {
    const content = renderInternalDocsIndex()
    expect(content).toContain('Do not load this whole tree by default')
    expect(content).toContain('architecture/')
    expect(content).not.toContain('capabilities/')
    expect(content).not.toContain('decisions/')
    expect(content).not.toContain('reference/')
  })

  it('renders plans lifecycle rules without asserting dirs exist', () => {
    const content = renderPlansIndex()
    expect(content).toContain('Create `active/` when you start approved work')
    expect(content).toContain('Never treat `archive/` as current behavior')
  })

  it('uses package manager in fullstack handoff commands', () => {
    const pnpm = buildRootAgentsMd(makeConfig({ packageManager: 'pnpm' }))
    expect(pnpm).toContain('`pnpm lint`')
    expect(pnpm).toContain('`pnpm check-types`')
    expect(pnpm).toContain('`pnpm build`')
    expect(pnpm).not.toMatch(/Run `bun run lint/)
  })

  it('does not embed JSX comments in generated AGENTS.md', () => {
    const content = buildRootAgentsMd(makeConfig())
    expect(content).not.toContain('{/*')
    expect(content).toContain('<!-- These instructions are for AI agents')
  })

  it('keeps layering rules out of the architecture doc', () => {
    const architecture = buildGeneratedArchitectureMd(makeConfig({ family: 'fullstack' }))
    expect(architecture).toContain('See "Where Things Go" in AGENTS.md')
    expect(architecture).not.toContain('Use PATCH for partial updates')
  })
})

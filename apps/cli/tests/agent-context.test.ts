import { describe, expect, it } from 'bun:test'
import { buildRootAgentsMd } from '../src/lib/generators/agent-docs'
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

  it('renders internal docs index with loading rules', () => {
    const content = renderInternalDocsIndex()
    expect(content).toContain('Do not load this whole tree by default')
    expect(content).toContain('architecture/')
    expect(content).toContain('capabilities/')
    expect(content).toContain('decisions/')
  })

  it('renders plans lifecycle rules', () => {
    const content = renderPlansIndex()
    expect(content).toContain('active/')
    expect(content).toContain('completed/')
    expect(content).toContain('archive/')
    expect(content).toContain('Never treat `archive/` as current behavior')
  })
})

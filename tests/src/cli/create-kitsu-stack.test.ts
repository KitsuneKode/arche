import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildGeneratedArchitectureMd,
  buildRootAgentsMd,
} from '../../../apps/cli/src/lib/generators/agent-docs'
import { renderGithubActionsWorkflow } from '../../../apps/cli/src/lib/generators/ci'
import { renderDockerCompose } from '../../../apps/cli/src/lib/generators/docker'
import { buildServerEnv } from '../../../apps/cli/src/lib/generators/env'
import { buildReadme } from '../../../apps/cli/src/lib/generators/readme'
import {
  buildCleanupTargets,
  sanitizeProjectName,
  scaffoldProject,
} from '../../../apps/cli/src/lib/scaffold'
import type { ProjectConfig } from '../../../apps/cli/src/types/schemas'

function baseConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'test-app',
    destinationDir: '/tmp/test-app',
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
    ...overrides,
  }
}

describe('project name sanitization', () => {
  it('sanitizes project names into package-safe slugs', () => {
    expect(sanitizeProjectName('My Cool App')).toBe('my-cool-app')
  })

  it('rejects empty input after sanitization', () => {
    expect(() => sanitizeProjectName('')).toThrow()
  })
})

describe('cleanup targets', () => {
  it('strips showcase and worker when opted out for fullstack', () => {
    expect(
      buildCleanupTargets({
        includeShowcase: false,
        includeWorker: false,
        testing: 'none',
        family: 'fullstack',
      }),
    ).toEqual(['readme', 'showcase', 'seed', 'worker', 'tests'])
  })

  it('does not strip worker for other families by default', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: false,
      testing: 'bun',
      family: 'next',
    })
    expect(targets).toContain('worker')
  })
})

describe('docker compose output', () => {
  it('renders docker compose with project-specific database naming', () => {
    const config = baseConfig({ projectName: 'my-cool-app' })
    expect(renderDockerCompose(config)).toContain('POSTGRES_DB: my_cool_app')
  })
})

describe('CI workflow', () => {
  it('adds a test step to CI only when tests are enabled', () => {
    expect(renderGithubActionsWorkflow(baseConfig({ testing: 'bun' }))).toContain('Run tests')
    expect(renderGithubActionsWorkflow(baseConfig({ testing: 'none' }))).not.toContain('Run tests')
  })
})

describe('server env', () => {
  it('renders a server env with local defaults', () => {
    const env = buildServerEnv(baseConfig({ projectName: 'demo-app' }))
    expect(env).toContain('DATABASE_URL=postgresql://postgres:postgres@localhost:5432/demo_app')
    expect(env).toContain('BETTER_AUTH_URL=http://localhost:8080')
  })
})

describe('family-aware readme', () => {
  it('includes scaffold metadata for fullstack family', () => {
    const readme = buildReadme(baseConfig())
    expect(readme).toContain('@kitsunekode/arche')
    expect(readme).toContain('`fullstack`')
    expect(readme).toContain('bun dev')
    expect(readme).toContain('AGENTS.md')
  })

  it('includes next preset id for next family', () => {
    const readme = buildReadme(baseConfig({ family: 'next', presets: ['auth'] }))
    expect(readme).toContain('`next`')
    expect(readme).toContain('bun install')
    expect(readme).toContain('arche.json')
  })
})

describe('family-aware agent docs', () => {
  it('includes fullstack key dirs for fullstack family', () => {
    const agents = buildRootAgentsMd(baseConfig())
    expect(agents).toContain('apps/web')
    expect(agents).toContain('packages/trpc')
    expect(agents).toContain('packages/store')
  })

  it('includes next-specific key dirs for next family', () => {
    const agents = buildRootAgentsMd(baseConfig({ family: 'next' }))
    expect(agents).toContain('components')
    expect(agents).not.toContain('apps/web')
    expect(agents).not.toContain('packages/trpc')
  })
})

describe('family-aware context', () => {
  it('includes fullstack architecture sections for fullstack family', () => {
    const ctx = buildGeneratedArchitectureMd(baseConfig())
    expect(ctx).toContain('tRPC')
    expect(ctx).toContain('Next.js')
  })

  it('includes next-specific architecture for next family', () => {
    const ctx = buildGeneratedArchitectureMd(baseConfig({ family: 'next' }))
    expect(ctx).toContain('Next.js')
    expect(ctx).not.toContain('tRPC')
  })

  it('includes backend-specific architecture for backend family', () => {
    const ctx = buildGeneratedArchitectureMd(
      baseConfig({
        family: 'backend',
        backend: 'express-bun',
        database: 'postgres',
        orm: 'prisma',
      }),
    )
    expect(ctx).toContain('API service')
    expect(ctx).toContain('express-bun')
    expect(ctx).not.toContain('Frontend')
  })

  it('includes convex architecture for convex family', () => {
    const ctx = buildGeneratedArchitectureMd(baseConfig({ family: 'convex' }))
    expect(ctx).toContain('Convex')
    expect(ctx).toContain('serverless')
    expect(ctx).toContain('Next.js')
  })
})

describe('scaffold smoke tests', () => {
  const tsTurboDir = '/tmp/opencode/test-fullstack-scaffold'
  const backendDir = '/tmp/opencode/test-backend-scaffold'

  it('scaffolds a fullstack project and produces expected files', async () => {
    try {
      Bun.spawnSync(['rm', '-rf', tsTurboDir])
    } catch {}

    const result = await scaffoldProject(
      baseConfig({
        projectName: 'smoke-fullstack',
        destinationDir: tsTurboDir,
        includeShowcase: true,
        includeWorker: true,
        includeDocker: true,
        includeCi: true,
        initializeGit: false,
        installDependencies: false,
      }),
    )

    expect(result.packageName).toBe('smoke-fullstack')
    expect(existsSync(join(tsTurboDir, 'package.json'))).toBe(true)
    expect(existsSync(join(tsTurboDir, 'apps/server'))).toBe(true)
    expect(existsSync(join(tsTurboDir, 'apps/web'))).toBe(true)
    expect(existsSync(join(tsTurboDir, 'packages/trpc'))).toBe(true)
    expect(existsSync(join(tsTurboDir, 'docker-compose.yml'))).toBe(true)
    expect(existsSync(join(tsTurboDir, 'SHOWCASE.mdx'))).toBe(true)
  })

  it('scaffolds a backend project and produces expected files', async () => {
    try {
      Bun.spawnSync(['rm', '-rf', backendDir])
    } catch {}

    const result = await scaffoldProject(
      baseConfig({
        projectName: 'smoke-backend',
        destinationDir: backendDir,
        family: 'backend',
        backend: 'express-bun',
        database: 'postgres',
        orm: 'prisma',
        includeDocker: true,
        includeCi: true,
        initializeGit: false,
        installDependencies: false,
      }),
    )

    expect(result.packageName).toBe('smoke-backend')
    expect(existsSync(join(backendDir, 'package.json'))).toBe(true)
    // Backend family is a standalone project (not a monorepo with apps/server)
    expect(existsSync(join(backendDir, 'src'))).toBe(true)
    expect(existsSync(join(backendDir, '.env.example'))).toBe(true)
    expect(existsSync(join(backendDir, 'docker-compose.yml'))).toBe(true)
    expect(existsSync(join(backendDir, 'AGENTS.md'))).toBe(true)
    expect(existsSync(join(backendDir, '.docs/architecture/generated-project.md'))).toBe(true)
  })
})

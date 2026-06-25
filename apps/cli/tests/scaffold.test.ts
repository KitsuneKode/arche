import { describe, expect, it } from 'bun:test'
import { renderGithubActionsWorkflow } from '../src/lib/generators/ci'
import { renderDeploymentGuide } from '../src/lib/generators/deployment'
import { renderDockerCompose, renderDockerComposeProd } from '../src/lib/generators/docker'
import { buildServerEnv, buildWebEnv } from '../src/lib/generators/env'
import { buildReproducibleCommand } from '../src/lib/reproducible'
import { buildCleanupTargets } from '../src/lib/scaffold'
import { resolveDestinationDir, sanitizeProjectName } from '../src/lib/slug'
import type { ProjectConfig } from '../src/types/schemas'

/** Helper to build a minimal ProjectConfig for testing generators */
function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
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
    includeLiveDemo: false,
    includeDocker: true,
    includeCi: true,
    initializeGit: true,
    installDependencies: true,
    rustAuth: 'placeholder',
    ...overrides,
  }
}

describe('resolveDestinationDir', () => {
  it('places project under cwd by default', () => {
    const { projectName, destinationDir } = resolveDestinationDir('my-app')
    expect(projectName).toBe('my-app')
    expect(destinationDir.endsWith('/my-app') || destinationDir.endsWith('\\my-app')).toBe(true)
  })

  it('uses --dir as parent directory', () => {
    const { destinationDir } = resolveDestinationDir('my-app', '/tmp/projects')
    expect(destinationDir).toBe('/tmp/projects/my-app')
  })

  it('treats --dir as full path when basename matches project slug', () => {
    const { destinationDir } = resolveDestinationDir('my-app', '/tmp/projects/my-app')
    expect(destinationDir).toBe('/tmp/projects/my-app')
  })
})

describe('buildReproducibleCommand', () => {
  it('uses arche create with family positional', () => {
    const cmd = buildReproducibleCommand(makeConfig())
    expect(cmd).toContain('npx @kitsunekode/arche create test-app fullstack --yes')
  })
})

describe('sanitizeProjectName', () => {
  it('converts to lowercase slug', () => {
    expect(sanitizeProjectName('My Project')).toBe('my-project')
    expect(sanitizeProjectName('UPPER')).toBe('upper')
  })

  it('replaces spaces and special chars with dashes', () => {
    expect(sanitizeProjectName('hello world')).toBe('hello-world')
    expect(sanitizeProjectName('hello_world')).toBe('hello-world')
    expect(sanitizeProjectName('hello.world')).toBe('hello-world')
  })

  it('removes leading/trailing dashes', () => {
    expect(sanitizeProjectName('--test--')).toBe('test')
    expect(sanitizeProjectName('-leading')).toBe('leading')
    expect(sanitizeProjectName('trailing-')).toBe('trailing')
  })

  it('handles paths by extracting basename', () => {
    expect(sanitizeProjectName('/path/to/my-project')).toBe('my-project')
    expect(sanitizeProjectName('./relative/path/cool_app')).toBe('cool-app')
  })

  it('throws for empty or invalid names', () => {
    expect(() => sanitizeProjectName('')).toThrow()
    expect(() => sanitizeProjectName('---')).toThrow()
    expect(() => sanitizeProjectName('...')).toThrow()
  })
})

describe('buildCleanupTargets', () => {
  it('always includes readme', () => {
    const targets = buildCleanupTargets({
      includeShowcase: true,
      includeWorker: true,
      includeLiveDemo: true,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).toContain('readme')
  })

  it('excludes showcase and seed when showcase disabled', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: true,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).toContain('showcase')
    expect(targets).toContain('seed')
    expect(targets).toContain('live')
  })

  it('excludes worker when disabled', () => {
    const targets = buildCleanupTargets({
      includeShowcase: true,
      includeWorker: false,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).toContain('worker')
    expect(targets).toContain('live')
  })

  it('excludes tests when testing is none', () => {
    const targets = buildCleanupTargets({
      includeShowcase: true,
      includeWorker: true,
      includeLiveDemo: false,
      testing: 'none',
      family: 'fullstack',
    })
    expect(targets).toContain('tests')
  })

  it('strips live demo by default on fullstack', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: false,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).toContain('live')
    expect(targets).toContain('readme')
  })

  it('keeps live demo when includeLiveDemo is true', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: false,
      includeLiveDemo: true,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).not.toContain('live')
  })
})

describe('buildCleanupTargets — family awareness', () => {
  it('fullstack with full options strips nothing extra', () => {
    const targets = buildCleanupTargets({
      includeShowcase: true,
      includeWorker: true,
      includeLiveDemo: true,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).toEqual(['readme'])
  })

  it('fullstack without showcase strips showcase and seed', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: true,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).toContain('showcase')
    expect(targets).toContain('seed')
    expect(targets).not.toContain('worker')
  })

  it('fullstack without worker strips worker', () => {
    const targets = buildCleanupTargets({
      includeShowcase: true,
      includeWorker: false,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'fullstack',
    })
    expect(targets).toContain('worker')
  })

  it('backend always strips showcase, seed, and worker', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: false,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'backend',
    })
    expect(targets).toContain('showcase')
    expect(targets).toContain('seed')
    expect(targets).toContain('worker')
  })

  it('next always strips worker (via shouldDefaultStripWorker)', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: false,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'next',
    })
    expect(targets).toContain('worker')
  })

  it('non-fullstack families always strip worker', () => {
    for (const family of [
      'backend',
      'next',
      'rust',
      'solana',
      'convex',
      'worker',
      'lib',
      'cli',
      'mobile',
      'polyglot',
    ] as const) {
      const targets = buildCleanupTargets({
        includeShowcase: false,
        includeWorker: false,
        includeLiveDemo: false,
        testing: 'bun',
        family,
      })
      expect(targets).toContain('worker')
    }
  })

  it('non-fullstack families always strip showcase and seed', () => {
    for (const family of [
      'backend',
      'next',
      'rust',
      'solana',
      'convex',
      'worker',
      'lib',
      'cli',
      'mobile',
      'polyglot',
    ] as const) {
      const targets = buildCleanupTargets({
        includeShowcase: false,
        includeWorker: false,
        includeLiveDemo: false,
        testing: 'bun',
        family,
      })
      expect(targets).toContain('showcase')
      expect(targets).toContain('seed')
    }
  })

  it('duplicate worker entry is not present when worker already stripped by family', () => {
    const targets = buildCleanupTargets({
      includeShowcase: false,
      includeWorker: false,
      includeLiveDemo: false,
      testing: 'bun',
      family: 'next',
    })
    const workerCount = targets.filter((t) => t === 'worker').length
    expect(workerCount).toBe(1)
  })
})

describe('renderDockerCompose', () => {
  it('generates postgres + redis for postgres database', () => {
    const output = renderDockerCompose(makeConfig({ projectName: 'my-app', database: 'postgres' }))
    expect(output).toContain('POSTGRES_DB: my_app')
    expect(output).toContain('postgres:16-alpine')
    expect(output).toContain('redis:7-alpine')
    expect(output).toContain('volumes:')
  })

  it('generates redis only for sqlite database', () => {
    const output = renderDockerCompose(makeConfig({ database: 'sqlite' }))
    expect(output).toContain('redis:7-alpine')
    expect(output).not.toContain('postgres')
    expect(output).not.toContain('mongo')
  })

  it('generates no services for frontend-only with no database', () => {
    const output = renderDockerCompose(makeConfig({ database: 'none', backend: 'none' }))
    expect(output).toContain('No Docker services needed')
  })

  it('production compose includes services referenced by depends_on', () => {
    const output = renderDockerComposeProd(makeConfig({ database: 'postgres' }))
    expect(output).toContain('  postgres:')
    expect(output).toContain('  redis:')
    expect(output).toContain('      - postgres')
    expect(output).toContain('      - redis')
  })

  it('production compose routes service API backends to services/api', () => {
    const output = renderDockerComposeProd(
      makeConfig({ backend: 'rust-axum', database: 'postgres', orm: 'none' }),
    )
    expect(output).toContain('  api:')
    expect(output).toContain('dockerfile: services/api/Dockerfile')
    expect(output).toContain('env_file: ./services/api/.env')
    expect(output).not.toContain('apps/server/Dockerfile')
  })
})

describe('renderGithubActionsWorkflow', () => {
  it('includes test step when tests enabled', () => {
    const output = renderGithubActionsWorkflow(makeConfig({ testing: 'bun' }))
    expect(output).toContain('Run tests')
    expect(output).toContain('bun test')
  })

  it('excludes test step when tests disabled', () => {
    const output = renderGithubActionsWorkflow(makeConfig({ testing: 'none' }))
    expect(output).not.toContain('Run tests')
    expect(output).not.toContain('bun test')
  })

  it('includes common CI steps', () => {
    const output = renderGithubActionsWorkflow(makeConfig({ testing: 'none' }))
    expect(output).toContain('Lint')
    expect(output).toContain('Typecheck')
    expect(output).toContain('oven-sh/setup-bun')
    expect(output).toContain('bun install')
  })

  it('uses pnpm CI when pnpm is selected', () => {
    const output = renderGithubActionsWorkflow(
      makeConfig({ packageManager: 'pnpm', testing: 'none' }),
    )
    expect(output).toContain('pnpm/action-setup')
    expect(output).toContain('pnpm install')
    expect(output).toContain('pnpm run lint')
    expect(output).toContain('pnpm run check-types')
    expect(output).not.toContain('oven-sh/setup-bun')
  })

  it('uses npm CI when npm is selected', () => {
    const output = renderGithubActionsWorkflow(
      makeConfig({ packageManager: 'npm', testing: 'none' }),
    )
    expect(output).toContain('actions/setup-node')
    expect(output).toContain('npm install')
    expect(output).toContain('npm run lint')
    expect(output).toContain('npm run check-types')
    expect(output).not.toContain('oven-sh/setup-bun')
  })

  it('uses standalone CI for backend family', () => {
    const output = renderGithubActionsWorkflow(makeConfig({ family: 'backend' }))
    expect(output).toContain('bun run build')
    expect(output).toContain('bun run lint')
    expect(output).toContain('bun run check-types')
    expect(output).not.toContain('repo:doctor')
    expect(output).not.toContain('tests/src')
  })
})

describe('renderDeploymentGuide', () => {
  it('mentions project name in output', () => {
    const output = renderDeploymentGuide(makeConfig({ projectName: 'test-project' }))
    expect(output).toContain('test-project')
  })

  it('includes worker deployment when enabled', () => {
    const output = renderDeploymentGuide(makeConfig({ includeWorker: true }))
    expect(output).toContain('apps/worker')
  })

  it('notes worker optional when disabled', () => {
    const output = renderDeploymentGuide(makeConfig({ includeWorker: false }))
    expect(output).toContain('Worker optional')
  })

  it('adapts to backend selection', () => {
    const express = renderDeploymentGuide(makeConfig({ backend: 'express-bun' }))
    expect(express).toContain('Express (Bun)')
    expect(express).toContain('Path A')
    expect(express).toContain('Path C')
    expect(express).toContain('Neon')

    const hono = renderDeploymentGuide(makeConfig({ backend: 'hono-bun' }))
    expect(hono).toContain('Hono (Bun)')

    const none = renderDeploymentGuide(makeConfig({ backend: 'none' }))
    expect(none).toContain('None (frontend only)')
  })
})

describe('buildServerEnv', () => {
  it('includes project-specific postgres DATABASE_URL', () => {
    const output = buildServerEnv(makeConfig({ projectName: 'my-app', database: 'postgres' }))
    expect(output).toContain('postgresql://postgres:postgres@localhost:5432/my_app')
  })

  it('includes sqlite DATABASE_URL for sqlite', () => {
    const output = buildServerEnv(makeConfig({ database: 'sqlite' }))
    expect(output).toContain('DATABASE_URL=file:./dev.db')
  })

  it('omits DATABASE_URL when no database', () => {
    const output = buildServerEnv(makeConfig({ database: 'none' }))
    expect(output).not.toContain('DATABASE_URL')
  })

  it('includes required server env vars', () => {
    const output = buildServerEnv(makeConfig())
    expect(output).toContain('PORT=8080')
    expect(output).toContain('BETTER_AUTH_SECRET')
    expect(output).toContain('REDIS_URL')
  })
})

describe('buildWebEnv', () => {
  it('includes frontend URLs', () => {
    const output = buildWebEnv()
    expect(output).toContain('NEXT_PUBLIC_APP_URL')
    expect(output).toContain('NEXT_PUBLIC_API_URL')
  })
})

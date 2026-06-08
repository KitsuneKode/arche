import { describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import workspaceCatalog from '../../../toolings/catalog/workspace-catalog.json' with { type: 'json' }
import { createProject } from '../src/lib/create'
import type { ProjectConfig } from '../src/types/schemas'

function makeConfig(
  destinationDir: string,
  packageManager: ProjectConfig['packageManager'],
): ProjectConfig {
  return {
    projectName: `catalog-${packageManager}`,
    destinationDir,
    family: 'fullstack',
    bundles: [],
    packageManager,
    database: 'postgres',
    vectorDatabase: 'none',
    orm: 'prisma',
    backend: 'express-bun',
    runtime: 'bun',
    example: 'none',
    testing: 'bun',
    deployment: 'none',
    includeShowcase: false,
    includeWorker: false,
    includeDocker: false,
    includeCi: false,
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
  }
}

async function createFullstack(packageManager: ProjectConfig['packageManager']) {
  const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-workspace-output-'))
  const destinationDir = join(tmpRoot, packageManager)
  const result = await createProject({
    config: makeConfig(destinationDir, packageManager),
    dryRun: false,
  })
  expect(result.success).toBe(true)

  return { tmpRoot, destinationDir }
}

describe('fullstack workspace output', () => {
  it('emits Bun-native catalogs and canonical Turbo root commands', async () => {
    const { tmpRoot, destinationDir } = await createFullstack('bun')

    try {
      const root = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8'))
      const web = JSON.parse(readFileSync(join(destinationDir, 'apps/web/package.json'), 'utf8'))
      const backendCommon = JSON.parse(
        readFileSync(join(destinationDir, 'packages/backend-common/package.json'), 'utf8'),
      )
      const appRedis = readFileSync(
        join(destinationDir, 'packages/backend-common/src/redis/index.ts'),
        'utf8',
      )
      const bullRedis = readFileSync(
        join(destinationDir, 'packages/backend-common/src/redis/bull-connection.ts'),
        'utf8',
      )

      expect(root.packageManager).toStartWith('bun@')
      expect(root.workspaces.packages).toContain('apps/*')
      expect(root.workspaces.catalog).toEqual(workspaceCatalog)
      const turbo = JSON.parse(readFileSync(join(destinationDir, 'turbo.json'), 'utf8'))
      expect(turbo.tasks.transit.dependsOn).toEqual(['^transit'])
      expect(turbo.tasks.lint.dependsOn).toEqual(['transit'])
      expect(turbo.tasks['mdx:generate']).toBeUndefined()
      expect(root.overrides?.ioredis).toBe('5.10.1')
      expect(root.overrides?.kysely).toBeUndefined()
      expect(root.scripts['dev:web']).toStartWith('turbo run dev --filter=')
      expect(root.scripts['db:migrate']).toBe('turbo run db:migrate')
      expect(web.devDependencies.typescript).toBe('catalog:')
      expect(web.dependencies.zod).toBe('catalog:')
      expect(backendCommon.dependencies.redis).toBe('catalog:')
      expect(backendCommon.dependencies.ioredis).toBe('catalog:')
      expect(appRedis).toContain("from 'redis'")
      expect(appRedis).not.toContain("from 'ioredis'")
      expect(bullRedis).toContain("from 'ioredis'")
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)

  it('emits pnpm-native catalogs while keeping Bun runtime available', async () => {
    const { tmpRoot, destinationDir } = await createFullstack('pnpm')

    try {
      const root = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8'))
      const web = JSON.parse(readFileSync(join(destinationDir, 'apps/web/package.json'), 'utf8'))
      const backendCommon = JSON.parse(
        readFileSync(join(destinationDir, 'packages/backend-common/package.json'), 'utf8'),
      )
      const pnpmWorkspace = readFileSync(join(destinationDir, 'pnpm-workspace.yaml'), 'utf8')

      expect(root.packageManager).toStartWith('pnpm@')
      expect(root.workspaces).toBeUndefined()
      expect(root.scripts.preinstall).toBeUndefined()
      expect(root.engines.bun).toBeDefined()
      expect(pnpmWorkspace).toContain('catalog:')
      expect(pnpmWorkspace).toContain('  typescript:')
      expect(pnpmWorkspace).toContain('  redis:')
      expect(pnpmWorkspace).toContain('  ioredis:')
      expect(web.devDependencies.typescript).toBe('catalog:')
      expect(web.dependencies.zod).toBe('catalog:')
      expect(backendCommon.dependencies.redis).toBe('catalog:')
      expect(backendCommon.dependencies.ioredis).toBe('catalog:')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)
})

describe('standalone JavaScript package-manager output', () => {
  it('pins pnpm without generating workspace catalogs for a Next.js app', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-standalone-output-'))
    const destinationDir = join(tmpRoot, 'next-pnpm')

    try {
      const result = await createProject({
        config: {
          ...makeConfig(destinationDir, 'pnpm'),
          projectName: 'next-pnpm',
          family: 'next',
          database: 'none',
          orm: 'none',
          backend: 'none',
        },
        dryRun: false,
      })
      expect(result.success).toBe(true)

      const root = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8'))
      expect(root.packageManager).toStartWith('pnpm@')
      expect(root.engines.bun).toBeDefined()
      expect(root.engines.node).toBeDefined()
      expect(root.workspaces).toBeUndefined()
      expect(() => readFileSync(join(destinationDir, 'pnpm-workspace.yaml'), 'utf8')).toThrow()
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)
})

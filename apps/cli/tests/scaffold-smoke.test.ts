import { describe, expect, it } from 'bun:test'
import { existsSync, lstatSync, readFileSync, readlinkSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import type { Family, PackageManager, ProjectConfig } from '../src/types/schemas'

function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'smoke-app',
    destinationDir: '/tmp/smoke-app',
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

const MATRIX: Array<{
  family: Family
  pm: PackageManager
  bundles?: ProjectConfig['bundles']
  backend?: ProjectConfig['backend']
  database?: ProjectConfig['database']
  orm?: ProjectConfig['orm']
  includeWorker?: boolean
  includeShowcase?: boolean
}> = [
  {
    family: 'fullstack',
    pm: 'bun',
    bundles: ['product', 'realtime', 'ai'],
    includeWorker: true,
    includeShowcase: true,
  },
  {
    family: 'next',
    pm: 'pnpm',
    bundles: ['product', 'growth'],
    backend: 'none',
    database: 'none',
    orm: 'none',
  },
  { family: 'backend', pm: 'pnpm', bundles: ['product', 'infra'], includeWorker: false },
  {
    family: 'lib',
    pm: 'bun',
    bundles: ['product'],
    backend: 'none',
    database: 'none',
    orm: 'none',
  },
  {
    family: 'worker',
    pm: 'pnpm',
    bundles: ['product'],
    backend: 'none',
    database: 'none',
    orm: 'none',
  },
]

describe('scaffold smoke matrix', () => {
  for (const entry of MATRIX) {
    it(`scaffolds ${entry.family} with ${entry.pm}`, async () => {
      const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-scaffold-smoke-'))
      const destinationDir = join(tmpRoot, `${entry.family}-${entry.pm}`)
      try {
        const result = await createProject({
          config: makeConfig({
            destinationDir,
            projectName: `${entry.family}-${entry.pm}`,
            family: entry.family,
            packageManager: entry.pm,
            bundles: entry.bundles ?? ['product'],
            backend: entry.backend ?? 'express-bun',
            database: entry.database ?? 'postgres',
            orm: entry.orm ?? 'prisma',
            includeWorker: entry.includeWorker ?? false,
            includeShowcase: entry.includeShowcase ?? false,
          }),
          dryRun: false,
        })

        if (!result.success) {
          throw new Error(`createProject failed: ${result.errors.join('; ')}`)
        }
        expect(result.result).toBeDefined()
        expect(existsSync(join(destinationDir, 'package.json'))).toBe(true)
        expect(existsSync(join(destinationDir, 'README.md'))).toBe(true)
        expect(existsSync(join(destinationDir, 'arche.json'))).toBe(true)

        const arche = JSON.parse(readFileSync(join(destinationDir, 'arche.json'), 'utf8'))
        expect(arche.family).toBe(entry.family)
        expect(arche.packageManager).toBe(entry.pm)

        if (entry.family === 'fullstack') {
          const rootPackage = readFileSync(join(destinationDir, 'package.json'), 'utf8')
          const rootPackageJson = JSON.parse(rootPackage)
          const serverPackage = readFileSync(
            join(destinationDir, 'apps/server/package.json'),
            'utf8',
          )
          const serverDockerfile = readFileSync(
            join(destinationDir, 'apps/server/Dockerfile'),
            'utf8',
          )
          const expectedScope = `@${entry.family}-${entry.pm}`

          expect(rootPackage).not.toContain('@arche-template/')
          expect(rootPackageJson.scripts.prepare).toBeUndefined()
          expect(rootPackageJson.scripts['pkg:check']).toBeUndefined()
          expect(rootPackageJson.scripts.release).toBeUndefined()
          expect(rootPackageJson.devDependencies.husky).toBeUndefined()
          expect(rootPackageJson.devDependencies['@changesets/cli']).toBeUndefined()
          expect(serverPackage).toContain(`"name": "${expectedScope}/server"`)
          expect(serverDockerfile).toContain(`turbo@2.9.14 prune ${expectedScope}/server --docker`)
          expect(serverDockerfile).not.toContain('@arche-template/')

          expect(existsSync(join(destinationDir, '.opencode/skills.json'))).toBe(true)
          expect(existsSync(join(destinationDir, 'AGENTS.md'))).toBe(true)
          expect(existsSync(join(destinationDir, 'CLAUDE.md'))).toBe(true)
          expect(lstatSync(join(destinationDir, 'CLAUDE.md')).isSymbolicLink()).toBe(true)
          expect(readlinkSync(join(destinationDir, 'CLAUDE.md'))).toBe('AGENTS.md')
          expect(existsSync(join(destinationDir, 'CONTEXT.md'))).toBe(false)
          expect(existsSync(join(destinationDir, '.docs/README.md'))).toBe(true)
          expect(existsSync(join(destinationDir, '.docs/architecture/generated-project.md'))).toBe(
            true,
          )
          expect(existsSync(join(destinationDir, '.plans/README.md'))).toBe(true)
          expect(existsSync(join(destinationDir, '.cursor/rules'))).toBe(false)
          expect(existsSync(join(destinationDir, '.claude/rules'))).toBe(false)
          expect(existsSync(join(destinationDir, 'out'))).toBe(false)
          expect(existsSync(join(destinationDir, 'apps/web/.next'))).toBe(false)
          expect(existsSync(join(destinationDir, 'apps/web/.source'))).toBe(false)
          expect(existsSync(join(destinationDir, 'apps/server/dist'))).toBe(false)
        }

        if (entry.family === 'next') {
          expect(existsSync(join(destinationDir, 'app/layout.tsx'))).toBe(true)
          expect(existsSync(join(destinationDir, 'apps/server'))).toBe(false)
        }

        if (entry.family === 'backend') {
          expect(existsSync(join(destinationDir, 'src/app.ts'))).toBe(true)
          expect(existsSync(join(destinationDir, 'src/server.ts'))).toBe(true)
          expect(existsSync(join(destinationDir, 'src/common/env.ts'))).toBe(true)
          expect(existsSync(join(destinationDir, 'src/modules/health/health.routes.ts'))).toBe(true)
          expect(existsSync(join(destinationDir, 'package.json'))).toBe(true)
          const backendArche = JSON.parse(readFileSync(join(destinationDir, 'arche.json'), 'utf8'))
          expect(backendArche.choices.backend).toBe('express-bun')
        }
      } finally {
        rmSync(tmpRoot, { recursive: true, force: true })
      }
    }, 60000)
  }
})

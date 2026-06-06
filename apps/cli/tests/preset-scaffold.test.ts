import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { projectDefaultsForPreset } from '../src/registry/preset-config'
import type { ProjectConfig } from '../src/types/schemas'

function configFromPreset(destinationDir: string): ProjectConfig {
  return {
    projectName: 'rust-fullstack',
    destinationDir,
    family: 'fullstack',
    bundles: [],
    packageManager: 'bun',
    database: 'postgres',
    vectorDatabase: 'none',
    orm: 'prisma',
    backend: 'express-bun',
    runtime: 'bun',
    addons: [],
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
    ...projectDefaultsForPreset('rust-fullstack'),
  }
}

describe('preset scaffold output', () => {
  it('scaffolds rust-fullstack as a web app plus services/api Rust workspace', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-rust-fullstack-'))
    const destinationDir = join(tmpRoot, 'app')

    try {
      const result = await createProject({
        config: configFromPreset(destinationDir),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'apps/web'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/server'))).toBe(false)
      expect(existsSync(join(destinationDir, 'Cargo.toml'))).toBe(true)
      expect(existsSync(join(destinationDir, 'services/api/Cargo.toml'))).toBe(true)
      expect(existsSync(join(destinationDir, 'services/api/src/main.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'services/api/.env.example'))).toBe(true)
      expect(existsSync(join(destinationDir, 'services/api/.env'))).toBe(true)
      expect(existsSync(join(destinationDir, 'services/api/Dockerfile'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/web/trpc'))).toBe(false)
      expect(existsSync(join(destinationDir, 'packages/auth'))).toBe(false)
      expect(existsSync(join(destinationDir, 'packages/store'))).toBe(false)
      expect(existsSync(join(destinationDir, 'packages/trpc'))).toBe(false)
      expect(existsSync(join(destinationDir, 'packages/backend-common'))).toBe(false)

      const cargoWorkspace = readFileSync(join(destinationDir, 'Cargo.toml'), 'utf8')
      expect(cargoWorkspace).toContain('[workspace]')
      expect(cargoWorkspace).toContain('"services/api"')

      const rootPackage = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8'))
      expect(rootPackage.packageManager).toStartWith('bun@')
      expect(rootPackage.workspaces.packages).toContain('services/*')
      expect(rootPackage.scripts.postinstall).toBeUndefined()
      expect(rootPackage.scripts['db:generate']).toBeUndefined()
      expect(rootPackage.scripts.prepare).toBeUndefined()
      expect(rootPackage.devDependencies.husky).toBeUndefined()
      expect(rootPackage.devDependencies['@changesets/cli']).toBeUndefined()

      const apiCargo = readFileSync(join(destinationDir, 'services/api/Cargo.toml'), 'utf8')
      expect(apiCargo).toContain('axum = "0.8"')
      expect(apiCargo).toContain('sqlx =')

      const webPackage = JSON.parse(
        readFileSync(join(destinationDir, 'apps/web/package.json'), 'utf8'),
      )
      expect(webPackage.dependencies['@arche-template/auth']).toBeUndefined()
      expect(webPackage.dependencies['@arche-template/store']).toBeUndefined()
      expect(webPackage.dependencies['@arche-template/trpc']).toBeUndefined()
      expect(Object.keys(webPackage.dependencies).some((key) => key.endsWith('/auth'))).toBe(false)
      expect(Object.keys(webPackage.dependencies).some((key) => key.endsWith('/store'))).toBe(false)
      expect(Object.keys(webPackage.dependencies).some((key) => key.endsWith('/trpc'))).toBe(false)

      const apiMain = readFileSync(join(destinationDir, 'services/api/src/main.rs'), 'utf8')
      expect(apiMain).toContain('let allowed_origin = frontend_url')
      expect(apiMain).toContain('.allow_origin(allowed_origin)')
      expect(apiMain).not.toContain('unwrap_or_default()')

      const architecture = readFileSync(
        join(destinationDir, '.docs/architecture/generated-project.md'),
        'utf8',
      )
      expect(architecture).toContain('services/api')
      expect(architecture).not.toContain('apps/server/src/app.ts')
      expect(architecture).toContain('Business logic belongs in services/use-cases')
      expect(architecture).toContain('Use PATCH for partial updates')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)
})

import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { FamilySchema } from '../src/types/schemas'
import type { ProjectConfig } from '../src/types/schemas'

function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'rust-api',
    destinationDir: '/tmp/rust-api',
    family: 'rust',
    bundles: [],
    packageManager: 'bun',
    database: 'postgres',
    vectorDatabase: 'none',
    orm: 'none',
    backend: 'rust-axum',
    runtime: 'bun',
    example: 'posts',
    testing: 'none',
    deployment: 'none',
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

describe('rust family schema', () => {
  it('includes rust in FamilySchema', () => {
    expect(FamilySchema.safeParse('rust').success).toBe(true)
  })
})

describe('rust scaffold output', () => {
  it('creates Axum module layout without TypeScript monorepo files', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-rust-'))
    const destinationDir = join(tmpRoot, 'my-rust-api')
    try {
      const result = await createProject({
        config: makeConfig({ destinationDir, projectName: 'my-rust-api' }),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'Cargo.toml'))).toBe(true)
      expect(existsSync(join(destinationDir, 'src/main.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'src/app.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'src/error.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'src/modules/posts/routes.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'src/modules/posts/handler.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'src/modules/posts/service.rs'))).toBe(true)
      expect(existsSync(join(destinationDir, 'src/modules/posts/repository.rs'))).toBe(true)

      expect(existsSync(join(destinationDir, 'apps/web'))).toBe(false)
      expect(existsSync(join(destinationDir, 'packages/trpc'))).toBe(false)
      expect(existsSync(join(destinationDir, 'packages/auth'))).toBe(false)
      expect(existsSync(join(destinationDir, 'package.json'))).toBe(false)

      const readme = readFileSync(join(destinationDir, 'README.md'), 'utf8')
      expect(readme).toContain('cargo run')
      expect(readme).toContain('@kitsunekode/arche')

      const agents = readFileSync(join(destinationDir, 'AGENTS.md'), 'utf8')
      expect(agents).toContain('.docs/README.md')
      const architecture = readFileSync(
        join(destinationDir, '.docs/architecture/generated-project.md'),
        'utf8',
      )
      expect(architecture).toContain('handler')
      expect(architecture).toContain('repository')

      const ci = readFileSync(join(destinationDir, '.github/workflows/ci.yml'), 'utf8')
      expect(ci).toContain('cargo fmt')
      expect(ci).toContain('cargo clippy')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)

  it('omits posts module when example is none', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-rust-min-'))
    const destinationDir = join(tmpRoot, 'api-only')
    try {
      await createProject({
        config: makeConfig({
          destinationDir,
          projectName: 'api-only',
          example: 'none',
        }),
        dryRun: false,
      })
      expect(existsSync(join(destinationDir, 'src/modules/posts'))).toBe(false)
      expect(existsSync(join(destinationDir, 'src/modules/health/routes.rs'))).toBe(true)
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)
})

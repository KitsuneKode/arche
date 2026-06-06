import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { projectDefaultsForPreset } from '../src/registry/preset-config'
import type { ProjectConfig } from '../src/types/schemas'

function configForConvex(destinationDir: string): ProjectConfig {
  return {
    projectName: 'convex-product',
    destinationDir,
    family: 'convex',
    bundles: [],
    packageManager: 'bun',
    database: 'none',
    vectorDatabase: 'none',
    orm: 'none',
    backend: 'none',
    runtime: 'bun',
    addons: [],
    example: 'none',
    testing: 'bun',
    deployment: 'none',
    includeShowcase: false,
    includeWorker: false,
    includeDocker: false,
    includeCi: true,
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
    preset: 'convex-product',
    ...projectDefaultsForPreset('convex-product'),
  }
}

describe('convex-product preset output', () => {
  it('scaffolds Next.js + Convex with schema, functions, and agent context', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-convex-product-'))
    const destinationDir = join(tmpRoot, 'app')

    try {
      const result = await createProject({
        config: configForConvex(destinationDir),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'convex/schema.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'convex/posts.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'convex/auth.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'convex/_generated/server.ts'))).toBe(true)
      expect(existsSync(join(destinationDir, 'app/providers.tsx'))).toBe(true)
      expect(existsSync(join(destinationDir, 'convex.json'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/server'))).toBe(false)
      expect(existsSync(join(destinationDir, 'docker-compose.yml'))).toBe(false)

      const architecture = readFileSync(
        join(destinationDir, '.docs/architecture/generated-project.md'),
        'utf8',
      )
      expect(architecture).toContain('Convex')

      const agents = readFileSync(join(destinationDir, 'AGENTS.md'), 'utf8')
      expect(agents.length).toBeGreaterThan(0)
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  }, 60000)
})

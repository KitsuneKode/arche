import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { buildRootAgentsMd } from '../src/lib/generators/agent-docs'
import type { ProjectConfig } from '../src/types/schemas'

function tanstackConfig(destinationDir: string): ProjectConfig {
  return {
    projectName: 'tanstack-structure',
    destinationDir,
    family: 'tanstack',
    bundles: [],
    packageManager: 'bun',
    database: 'none',
    vectorDatabase: 'none',
    orm: 'none',
    backend: 'none',
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
    preset: 'tanstack-start',
  }
}

describe('tanstack template structure', () => {
  it('scaffolds TanStack Start files, gitignores build output, and emits truthful agent docs', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-tanstack-structure-'))
    const destinationDir = join(tmpRoot, 'app')

    try {
      const result = await createProject({ config: tanstackConfig(destinationDir), dryRun: false })
      expect(result.success).toBe(true)

      for (const relativePath of [
        'src/router.tsx',
        'src/routeTree.gen.ts',
        'src/routes/__root.tsx',
        'src/routes/index.tsx',
        'src/routes/api/health.ts',
        'vite.config.ts',
        'tsconfig.json',
        '.oxlintrc.json',
      ]) {
        expect(existsSync(join(destinationDir, relativePath))).toBe(true)
      }

      // Build artifacts must never be copied from the template source.
      for (const stray of ['.output', '.nitro', '.tanstack', 'node_modules', 'bun.lock']) {
        expect(existsSync(join(destinationDir, stray))).toBe(false)
      }

      const pkg = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>
      }
      expect(pkg.dependencies?.['@tanstack/react-start']).toBeTruthy()
      expect(pkg.dependencies?.['@tanstack/react-router']).toBeTruthy()
      expect(pkg.dependencies?.react).toBeTruthy()

      const gitignore = readFileSync(join(destinationDir, '.gitignore'), 'utf8')
      expect(gitignore).toContain('.output/')
      expect(gitignore).toContain('.nitro/')

      const agents = buildRootAgentsMd(tanstackConfig(destinationDir))
      expect(agents).toContain('`src/routes`')
      expect(agents).not.toContain('`lib/auth`')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})

import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { buildRootAgentsMd } from '../src/lib/generators/agent-docs'
import type { ProjectConfig } from '../src/types/schemas'

function nextConfig(destinationDir: string): ProjectConfig {
  return {
    projectName: 'next-structure',
    destinationDir,
    family: 'next',
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
    includeLiveDemo: false,
    includeDocker: false,
    includeCi: false,
    initializeGit: false,
    installDependencies: false,
    presets: ['auth', 'docs'],
    rustAuth: 'placeholder',
  }
}

describe('next template structure', () => {
  it('scaffolds baseline depth files and honest agent docs', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-next-structure-'))
    const destinationDir = join(tmpRoot, 'app')

    try {
      const result = await createProject({ config: nextConfig(destinationDir), dryRun: false })
      expect(result.success).toBe(true)

      for (const relativePath of [
        'app/error.tsx',
        'app/loading.tsx',
        'app/not-found.tsx',
        'env.ts',
        'app/api/health/route.ts',
        'components/highlight-card.tsx',
        'README.md',
      ]) {
        expect(existsSync(join(destinationDir, relativePath))).toBe(true)
      }

      const envSource = readFileSync(join(destinationDir, 'env.ts'), 'utf8')
      expect(envSource).toContain('@t3-oss/env-nextjs')

      const agents = buildRootAgentsMd(nextConfig(destinationDir))
      expect(agents).not.toContain('Better Auth')
      expect(agents).not.toContain('Fumadocs')
      expect(agents).not.toContain('`lib/auth`')
      expect(agents).toContain('`components`')
      expect(agents).toContain('`env.ts`')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})

import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import { buildRootAgentsMd } from '../src/lib/generators/agent-docs'
import type { ProjectConfig } from '../src/types/schemas'

function tuiConfig(destinationDir: string): ProjectConfig {
  return {
    projectName: 'tui-structure',
    destinationDir,
    family: 'tui',
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
    presets: [],
    rustAuth: 'placeholder',
  }
}

describe('tui template structure', () => {
  it('scaffolds OpenTUI files and truthful agent docs', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-tui-structure-'))
    const destinationDir = join(tmpRoot, 'app')

    try {
      const result = await createProject({ config: tuiConfig(destinationDir), dryRun: false })
      expect(result.success).toBe(true)

      for (const relativePath of [
        'src/index.tsx',
        'src/app.tsx',
        'package.json',
        '.oxlintrc.json',
      ]) {
        expect(existsSync(join(destinationDir, relativePath))).toBe(true)
      }

      const pkg = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>
      }
      expect(pkg.dependencies?.['@opentui/react']).toBeTruthy()
      expect(pkg.dependencies?.['@opentui/core']).toBeTruthy()
      expect(pkg.dependencies?.react).toBeTruthy()

      const agents = buildRootAgentsMd(tuiConfig(destinationDir))
      expect(agents).toContain('`src/index.tsx`')
      expect(agents).toContain('`src/app.tsx`')
      expect(agents).not.toContain('`lib/auth`')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})

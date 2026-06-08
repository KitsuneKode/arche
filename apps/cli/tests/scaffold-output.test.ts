import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import type { ProjectConfig } from '../src/types/schemas'

function makeFullstackConfig(destinationDir: string): ProjectConfig {
  return {
    projectName: 'scaffold-output',
    destinationDir,
    family: 'fullstack',
    bundles: ['product'],
    packageManager: 'bun',
    database: 'postgres',
    vectorDatabase: 'none',
    orm: 'prisma',
    backend: 'express-bun',
    runtime: 'bun',
    example: 'none',
    testing: 'none',
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

describe('scaffold output hygiene', () => {
  it('does not copy local deploy artifacts or secret env files', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-output-hygiene-'))
    const destinationDir = join(tmpRoot, 'hygiene-app')
    try {
      const result = await createProject({
        config: makeFullstackConfig(destinationDir),
        dryRun: false,
      })
      expect(result.success).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/server/.vercel'))).toBe(false)
      expect(existsSync(join(destinationDir, 'apps/server/.vercel/.env.development.local'))).toBe(
        false,
      )

      const architecture = readFileSync(
        join(destinationDir, '.docs/architecture/generated-project.md'),
        'utf8',
      )
      expect(architecture).not.toContain('packages/ui')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it('pins ioredis for BullMQ compatibility in generated package.json', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-output-overrides-'))
    const destinationDir = join(tmpRoot, 'override-app')
    try {
      const result = await createProject({
        config: makeFullstackConfig(destinationDir),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      const root = JSON.parse(readFileSync(join(destinationDir, 'package.json'), 'utf8')) as {
        overrides?: Record<string, string>
        workspaces?: { catalog?: Record<string, string> }
      }
      expect(root.overrides?.ioredis).toBe('5.10.1')
      expect(root.overrides?.kysely).toBeUndefined()
      expect(root.overrides?.['better-auth']).toBe('1.6.11')
      expect(root.workspaces?.catalog?.ioredis).toBe('5.10.1')
      expect(root.workspaces?.catalog?.['better-auth']).toBe('1.6.11')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})

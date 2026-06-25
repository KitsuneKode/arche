import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { readFile, mkdir, writeFile, access, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyDatabaseTransform } from '../src/lib/generators/database'
import type { ProjectConfig } from '../src/types/schemas'

/** Helper to build a minimal ProjectConfig for testing generators */
function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'test-app',
    destinationDir: '/tmp/test-app',
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
    initializeGit: true,
    installDependencies: true,
    rustAuth: 'placeholder',
    ...overrides,
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

describe('applyDatabaseTransform', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `cli-db-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(tempDir, { recursive: true })

    // Create mock template files that would exist after copy
    await mkdir(join(tempDir, 'packages/store/prisma/migrations'), { recursive: true })
    await mkdir(join(tempDir, 'packages/store/src'), { recursive: true })
    await mkdir(join(tempDir, 'packages/auth/src'), { recursive: true })

    // Mock PostgreSQL Prisma schema
    await writeFile(
      join(tempDir, 'packages/store/prisma/schema.prisma'),
      'datasource db {\n  provider = "postgresql"\n}\n',
    )
    // Mock migration lock
    await writeFile(
      join(tempDir, 'packages/store/prisma/migrations/migration_lock.toml'),
      'provider = "postgresql"\n',
    )
    // Mock store index with pg adapter
    await writeFile(
      join(tempDir, 'packages/store/src/index.ts'),
      'import { PrismaPg } from "@prisma/adapter-pg"\nimport pg from "pg"\n',
    )
    // Mock prisma.config.ts
    await writeFile(
      join(tempDir, 'packages/store/prisma.config.ts'),
      'import { defineConfig } from "prisma/config"\nexport default defineConfig({ earlyAccess: true })\n',
    )
    // Mock store package.json
    await writeFile(
      join(tempDir, 'packages/store/package.json'),
      JSON.stringify(
        {
          name: '@test/store',
          dependencies: {
            '@prisma/adapter-pg': '^6.0.0',
            pg: '^8.13.0',
            '@prisma/client': '^6.0.0',
          },
        },
        null,
        2,
      ),
    )
    // Mock auth index
    await writeFile(
      join(tempDir, 'packages/auth/src/index.ts'),
      "import { prismaAdapter } from 'better-auth/adapters/prisma'\nprovider: 'postgresql'\n",
    )
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('does nothing for postgres (default)', async () => {
    const originalSchema = await readFile(
      join(tempDir, 'packages/store/prisma/schema.prisma'),
      'utf8',
    )
    await applyDatabaseTransform(tempDir, makeConfig({ database: 'postgres' }))
    const afterSchema = await readFile(join(tempDir, 'packages/store/prisma/schema.prisma'), 'utf8')
    expect(afterSchema).toBe(originalSchema)
  })

  describe('sqlite', () => {
    it('rewrites Prisma schema with sqlite provider', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      const schema = await readFile(join(tempDir, 'packages/store/prisma/schema.prisma'), 'utf8')
      expect(schema).toContain('provider = "sqlite"')
      expect(schema).not.toContain('postgresql')
    })

    it('includes all required models in schema', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      const schema = await readFile(join(tempDir, 'packages/store/prisma/schema.prisma'), 'utf8')
      expect(schema).toContain('model User')
      expect(schema).toContain('model Session')
      expect(schema).toContain('model Account')
      expect(schema).toContain('model Verification')
      expect(schema).toContain('model Post')
      expect(schema).toContain('model Message')
      expect(schema).toContain('model RelayRunScore')
    })

    it('rewrites store index with better-sqlite3 adapter', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      const index = await readFile(join(tempDir, 'packages/store/src/index.ts'), 'utf8')
      expect(index).toContain('PrismaBetterSqlite3')
      expect(index).toContain('PrismaClient')
      expect(index).not.toContain('@prisma/adapter-pg')
      expect(index).not.toContain('PrismaPg')
    })

    it('rewrites prisma.config.ts', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      const config = await readFile(join(tempDir, 'packages/store/prisma.config.ts'), 'utf8')
      expect(config).toContain('defineConfig')
      expect(config).toContain('schema.prisma')
    })

    it('removes old postgres migrations', async () => {
      expect(await pathExists(join(tempDir, 'packages/store/prisma/migrations'))).toBe(true)
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      expect(await pathExists(join(tempDir, 'packages/store/prisma/migrations'))).toBe(false)
    })

    it('patches store package.json (sqlite adapter deps)', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      const pkg = JSON.parse(await readFile(join(tempDir, 'packages/store/package.json'), 'utf8'))
      expect(pkg.dependencies['@prisma/adapter-pg']).toBeUndefined()
      expect(pkg.dependencies.pg).toBeUndefined()
      expect(pkg.dependencies['@prisma/adapter-better-sqlite3']).toBeDefined()
      expect(pkg.dependencies['better-sqlite3']).toBeDefined()
      expect(pkg.dependencies['@prisma/client']).toBeDefined()
    })

    it('rewrites auth with sqlite provider', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      const auth = await readFile(join(tempDir, 'packages/auth/src/index.ts'), 'utf8')
      expect(auth).toContain("provider: 'sqlite'")
      expect(auth).not.toContain("provider: 'postgresql'")
    })

    it('auth still exports toNodeHandler and fromNodeHeaders', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'sqlite' }))
      const auth = await readFile(join(tempDir, 'packages/auth/src/index.ts'), 'utf8')
      expect(auth).toContain('toNodeHandler')
      expect(auth).toContain('fromNodeHeaders')
    })
  })

  describe('none', () => {
    it('does not crash for database=none', async () => {
      await applyDatabaseTransform(tempDir, makeConfig({ database: 'none' }))
      // Should still have original files (no-op for now)
      expect(await pathExists(join(tempDir, 'packages/store/prisma/schema.prisma'))).toBe(true)
    })
  })
})

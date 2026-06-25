import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { readFile, mkdir, writeFile, access, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyOrmTransform } from '../src/lib/generators/orm'
import type { ProjectConfig } from '../src/types/schemas'

/** Helper to build a minimal ProjectConfig for testing generators */
function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'test-app',
    destinationDir: '/tmp/test-app',
    family: 'fullstack',
    bundles: ['product'],
    packageManager: 'bun',
    vectorDatabase: 'none',
    orm: 'prisma',
    backend: 'express-bun',
    runtime: 'bun',
    example: 'none',
    testing: 'bun',
    deployment: 'vercel-railway',
    includeShowcase: false,
    includeWorker: false,
    includeLiveDemo: false,
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

describe('applyOrmTransform', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(tmpdir(), `cli-orm-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    await mkdir(tempDir, { recursive: true })

    // Create mock template files that would exist after database transform
    await mkdir(join(tempDir, 'packages/store/prisma/migrations'), { recursive: true })
    await mkdir(join(tempDir, 'packages/store/src/generated'), { recursive: true })
    await mkdir(join(tempDir, 'packages/auth/src'), { recursive: true })
    await mkdir(join(tempDir, 'packages/trpc/src'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/trpc'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/post'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/chat'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/user'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/game'), { recursive: true })
    await mkdir(join(tempDir, 'packages/store/src/scripts'), { recursive: true })

    // Mock files
    await writeFile(
      join(tempDir, 'packages/store/prisma/schema.prisma'),
      'datasource db {\n  provider = "postgresql"\n}\n',
    )
    await writeFile(
      join(tempDir, 'packages/store/prisma.config.ts'),
      'import { defineConfig } from "prisma/config"\n',
    )
    await writeFile(
      join(tempDir, 'packages/store/src/index.ts'),
      'import { PrismaClient } from "./generated/client"\nexport { prisma }\n',
    )
    await writeFile(
      join(tempDir, 'packages/store/src/generated/client.ts'),
      'export class PrismaClient {}\n',
    )
    await writeFile(
      join(tempDir, 'packages/store/package.json'),
      JSON.stringify(
        {
          name: '@test/store',
          scripts: {
            'db:generate': 'bunx --bun prisma generate',
            'db:migrate': 'bunx --bun prisma migrate dev',
            'db:seed': 'bun run src/scripts/seed.ts',
            'db:studio': 'prisma studio',
          },
          dependencies: {
            '@prisma/adapter-pg': '^7.0.0',
            '@prisma/client': '^7.0.0',
            pg: '^8.19.0',
          },
          devDependencies: {
            prisma: '^7.0.0',
            '@types/pg': '^8.16.0',
          },
        },
        null,
        2,
      ),
    )
    await writeFile(
      join(tempDir, 'packages/auth/src/index.ts'),
      "import { prismaAdapter } from 'better-auth/adapters/prisma'\nprovider: 'postgresql'\n",
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/trpc/trpc.ts'),
      "import { prisma as db } from '@arche-template/store'\n",
    )
    await writeFile(
      join(tempDir, 'packages/trpc/src/index.ts'),
      "export { expressMiddleWare } from './trpc'\n",
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/post/post.trpc.ts'),
      "import { prisma } from '@arche-template/store'\nprisma.post.findMany()\n",
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/chat/chat.trpc.ts'),
      "import { prisma } from '@arche-template/store'\nprisma.message.findMany()\n",
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/user/user.trpc.ts'),
      "import { prisma } from '@arche-template/store'\nprisma.user.findMany()\n",
    )
    await writeFile(
      join(tempDir, 'packages/store/src/scripts/seed.ts'),
      "import { prisma } from '../index'\nawait prisma.user.create({ data: {} })\n",
    )
    await writeFile(
      join(tempDir, 'apps/server/package.json'),
      JSON.stringify({ name: '@test/server', dependencies: {} }, null, 2),
    )
    await writeFile(
      join(tempDir, 'apps/server/src/server.ts'),
      `import { prisma } from './db/index.js'
onShutdown(async () => {
  logger.info('Closing Prisma connection...')
  await prisma.$disconnect()
})`,
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/post/post.repository.ts'),
      'export const postRepo = {}\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/post/post.service.ts'),
      'export const postService = {}\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/game/game.repository.ts'),
      "import { prisma } from '../../db/index.js'\nprisma.relayRunScore.create()\n",
    )
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('does nothing for orm=prisma (default)', async () => {
    const originalIndex = await readFile(join(tempDir, 'packages/store/src/index.ts'), 'utf8')
    await applyOrmTransform(tempDir, makeConfig({ orm: 'prisma' }))
    const afterIndex = await readFile(join(tempDir, 'packages/store/src/index.ts'), 'utf8')
    expect(afterIndex).toBe(originalIndex)
  })

  it('does nothing for orm=none', async () => {
    const originalIndex = await readFile(join(tempDir, 'packages/store/src/index.ts'), 'utf8')
    await applyOrmTransform(tempDir, makeConfig({ orm: 'none' }))
    const afterIndex = await readFile(join(tempDir, 'packages/store/src/index.ts'), 'utf8')
    expect(afterIndex).toBe(originalIndex)
  })

  describe('drizzle + postgres', () => {
    const config = makeConfig({ orm: 'drizzle', database: 'postgres' })

    it('creates Drizzle schema with pgTable', async () => {
      await applyOrmTransform(tempDir, config)
      const schema = await readFile(join(tempDir, 'packages/store/src/schema.ts'), 'utf8')
      expect(schema).toContain('pgTable')
      expect(schema).toContain("from 'drizzle-orm/pg-core'")
      expect(schema).not.toContain('sqliteTable')
    })

    it('schema includes all models and relations', async () => {
      await applyOrmTransform(tempDir, config)
      const schema = await readFile(join(tempDir, 'packages/store/src/schema.ts'), 'utf8')
      expect(schema).toContain('export const user')
      expect(schema).toContain('export const session')
      expect(schema).toContain('export const account')
      expect(schema).toContain('export const verification')
      expect(schema).toContain('export const post')
      expect(schema).toContain('export const message')
      expect(schema).toContain('export const relayRunScore')
      expect(schema).toContain('export const userRelations')
      expect(schema).toContain('export const postRelations')
    })

    it('creates Drizzle store index with node-postgres driver', async () => {
      await applyOrmTransform(tempDir, config)
      const index = await readFile(join(tempDir, 'packages/store/src/index.ts'), 'utf8')
      expect(index).toContain("from 'drizzle-orm/node-postgres'")
      expect(index).toContain('export { db }')
      expect(index).toContain("export * from './schema'")
      expect(index).not.toContain('PrismaClient')
    })

    it('creates drizzle.config.ts for postgres', async () => {
      await applyOrmTransform(tempDir, config)
      const drizzleConfig = await readFile(
        join(tempDir, 'packages/store/drizzle.config.ts'),
        'utf8',
      )
      expect(drizzleConfig).toContain("dialect: 'postgresql'")
      expect(drizzleConfig).toContain("from 'drizzle-kit'")
      expect(drizzleConfig).toContain("schema: './src/schema.ts'")
    })

    it('removes prisma directory and generated files', async () => {
      expect(await pathExists(join(tempDir, 'packages/store/prisma'))).toBe(true)
      expect(await pathExists(join(tempDir, 'packages/store/src/generated'))).toBe(true)
      await applyOrmTransform(tempDir, config)
      expect(await pathExists(join(tempDir, 'packages/store/prisma'))).toBe(false)
      expect(await pathExists(join(tempDir, 'packages/store/src/generated'))).toBe(false)
    })

    it('removes prisma.config.ts', async () => {
      expect(await pathExists(join(tempDir, 'packages/store/prisma.config.ts'))).toBe(true)
      await applyOrmTransform(tempDir, config)
      expect(await pathExists(join(tempDir, 'packages/store/prisma.config.ts'))).toBe(false)
    })

    it('patches store package.json (swaps Prisma for Drizzle)', async () => {
      await applyOrmTransform(tempDir, config)
      const pkg = JSON.parse(await readFile(join(tempDir, 'packages/store/package.json'), 'utf8'))
      // Removed Prisma deps
      expect(pkg.dependencies['@prisma/adapter-pg']).toBeUndefined()
      expect(pkg.dependencies['@prisma/client']).toBeUndefined()
      // Added Drizzle deps
      expect(pkg.dependencies['drizzle-orm']).toBeDefined()
      expect(pkg.dependencies.pg).toBeDefined() // pg kept for node-postgres driver
      // Added Drizzle dev deps
      expect(pkg.devDependencies['drizzle-kit']).toBeDefined()
      expect(pkg.devDependencies.prisma).toBeUndefined()
      // Updated scripts
      expect(pkg.scripts['db:generate']).toContain('drizzle-kit generate')
      expect(pkg.scripts['db:migrate']).toContain('drizzle-kit migrate')
      expect(pkg.scripts['db:seed']).toContain('seed.ts')
    })

    it('rewrites seed script with Drizzle db.insert', async () => {
      await applyOrmTransform(tempDir, config)
      const seed = await readFile(join(tempDir, 'packages/store/src/scripts/seed.ts'), 'utf8')
      expect(seed).toContain('.insert(')
      expect(seed).not.toContain('prisma')
    })

    it('adds drizzle-orm to apps/server package.json', async () => {
      await applyOrmTransform(tempDir, config)
      const serverPkg = JSON.parse(
        await readFile(join(tempDir, 'apps/server/package.json'), 'utf8'),
      )
      expect(serverPkg.dependencies['drizzle-orm']).toBeDefined()
    })

    it('removes Prisma repository and service layers', async () => {
      await applyOrmTransform(tempDir, config)
      expect(
        await pathExists(join(tempDir, 'apps/server/src/modules/post/post.repository.ts')),
      ).toBe(false)
      expect(await pathExists(join(tempDir, 'apps/server/src/modules/post/post.service.ts'))).toBe(
        false,
      )
    })

    it('rewrites game repository for Drizzle when live demo is enabled', async () => {
      await applyOrmTransform(tempDir, { ...config, includeLiveDemo: true })
      const gameRepo = await readFile(
        join(tempDir, 'apps/server/src/modules/game/game.repository.ts'),
        'utf8',
      )
      expect(gameRepo).toContain("from '@arche-template/store'")
      expect(gameRepo).toContain('relayRunScore')
      expect(gameRepo).not.toContain('prisma')
    })

    it('rewrites auth with drizzleAdapter', async () => {
      await applyOrmTransform(tempDir, config)
      const auth = await readFile(join(tempDir, 'packages/auth/src/index.ts'), 'utf8')
      expect(auth).toContain('drizzleAdapter')
      expect(auth).toContain("from '@arche-template/store'")
      expect(auth).toContain("provider: 'pg'")
      expect(auth).not.toContain('prismaAdapter')
    })

    it('rewrites tRPC context for Express + Drizzle', async () => {
      await applyOrmTransform(tempDir, config)
      const trpc = await readFile(join(tempDir, 'apps/server/src/modules/trpc/trpc.ts'), 'utf8')
      expect(trpc).toContain("import { db } from '@arche-template/store'")
      expect(trpc).toContain("from '@trpc/server/adapters/express'")
      expect(trpc).not.toContain('prisma')
    })

    it('rewrites tRPC routers with Drizzle query API', async () => {
      await applyOrmTransform(tempDir, { ...config, includeLiveDemo: true })

      const postRouter = await readFile(
        join(tempDir, 'apps/server/src/modules/post/post.trpc.ts'),
        'utf8',
      )
      expect(postRouter).toContain("from '@arche-template/store'")
      expect(postRouter).toContain('db.query.post')
      expect(postRouter).toContain('db.insert(postTable)')
      expect(postRouter).toContain('db.update(postTable)')
      expect(postRouter).toContain('db.delete(postTable)')
      expect(postRouter).not.toContain('prisma')

      const chatRouter = await readFile(
        join(tempDir, 'apps/server/src/modules/chat/chat.trpc.ts'),
        'utf8',
      )
      expect(chatRouter).toContain('db.query.message')
      expect(chatRouter).toContain('db.insert(messageTable)')
      expect(chatRouter).not.toContain('prisma')

      const userRouter = await readFile(
        join(tempDir, 'apps/server/src/modules/user/user.trpc.ts'),
        'utf8',
      )
      expect(userRouter).toContain('db.query.user')
      expect(userRouter).not.toContain('prisma')
    })
  })

  describe('drizzle + sqlite', () => {
    const config = makeConfig({ orm: 'drizzle', database: 'sqlite' })

    it('creates Drizzle schema with sqliteTable', async () => {
      await applyOrmTransform(tempDir, config)
      const schema = await readFile(join(tempDir, 'packages/store/src/schema.ts'), 'utf8')
      expect(schema).toContain('sqliteTable')
      expect(schema).toContain("from 'drizzle-orm/sqlite-core'")
      expect(schema).not.toContain('pgTable')
    })

    it('creates Drizzle store index with bun-sqlite driver', async () => {
      await applyOrmTransform(tempDir, config)
      const index = await readFile(join(tempDir, 'packages/store/src/index.ts'), 'utf8')
      expect(index).toContain("from 'drizzle-orm/bun-sqlite'")
      expect(index).toContain("from 'bun:sqlite'")
      expect(index).not.toContain('node-postgres')
    })

    it('creates drizzle.config.ts for sqlite', async () => {
      await applyOrmTransform(tempDir, config)
      const drizzleConfig = await readFile(
        join(tempDir, 'packages/store/drizzle.config.ts'),
        'utf8',
      )
      expect(drizzleConfig).toContain("dialect: 'sqlite'")
    })

    it('patches store package.json (no pg dep for sqlite)', async () => {
      await applyOrmTransform(tempDir, config)
      const pkg = JSON.parse(await readFile(join(tempDir, 'packages/store/package.json'), 'utf8'))
      expect(pkg.dependencies.pg).toBeUndefined()
      expect(pkg.dependencies['drizzle-orm']).toBeDefined()
    })

    it('rewrites auth with drizzleAdapter for sqlite', async () => {
      await applyOrmTransform(tempDir, config)
      const auth = await readFile(join(tempDir, 'packages/auth/src/index.ts'), 'utf8')
      expect(auth).toContain("provider: 'sqlite'")
      expect(auth).toContain('drizzleAdapter')
    })
  })

  describe('drizzle + hono backend', () => {
    const config = makeConfig({ orm: 'drizzle', database: 'postgres', backend: 'hono-bun' })

    it('rewrites tRPC context for fetch-based backend', async () => {
      await applyOrmTransform(tempDir, config)
      const trpc = await readFile(join(tempDir, 'apps/server/src/modules/trpc/trpc.ts'), 'utf8')
      expect(trpc).toContain("import { db } from '@arche-template/store'")
      expect(trpc).toContain('{ headers }: { headers: Headers }')
      expect(trpc).not.toContain('@trpc/server/adapters/express')
      expect(trpc).not.toContain('prisma')
    })

    it('does not rewrite packages/trpc index (contract re-export lives in template)', async () => {
      const before = await readFile(join(tempDir, 'packages/trpc/src/index.ts'), 'utf8')
      await applyOrmTransform(tempDir, config)
      const after = await readFile(join(tempDir, 'packages/trpc/src/index.ts'), 'utf8')
      expect(after).toBe(before)
    })
  })

  describe('drizzle + express backend', () => {
    const config = makeConfig({ orm: 'drizzle', database: 'postgres', backend: 'express-bun' })

    it('does not rewrite packages/trpc index on express backend', async () => {
      const before = await readFile(join(tempDir, 'packages/trpc/src/index.ts'), 'utf8')
      await applyOrmTransform(tempDir, config)
      const after = await readFile(join(tempDir, 'packages/trpc/src/index.ts'), 'utf8')
      expect(after).toBe(before)
    })
  })
})

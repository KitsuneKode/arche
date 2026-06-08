import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { readFile, mkdir, writeFile, access, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyBackendTransform } from '../src/lib/generators/backend'
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

describe('applyBackendTransform', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = join(
      tmpdir(),
      `cli-backend-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    )
    await mkdir(tempDir, { recursive: true })

    // Create mock template files that would exist after copy
    await mkdir(join(tempDir, 'apps/server/src/common/middleware'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/trpc'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/admin'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/auth'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/health'), { recursive: true })
    await mkdir(join(tempDir, 'apps/server/src/modules/root'), { recursive: true })
    await mkdir(join(tempDir, 'packages/trpc/src'), { recursive: true })

    // Mock Express app.ts
    await writeFile(
      join(tempDir, 'apps/server/src/app.ts'),
      'import express from "express"\nconst app = express()\nexport { app }\n',
    )
    // Mock Express server.ts
    await writeFile(
      join(tempDir, 'apps/server/src/server.ts'),
      'import { app } from "./app"\napp.listen(8080)\n',
    )
    // Mock middleware
    await writeFile(
      join(tempDir, 'apps/server/src/common/middleware/error-handler.ts'),
      'export function errorHandler() {}\n',
    )
    // Mock server package.json
    await writeFile(
      join(tempDir, 'apps/server/package.json'),
      JSON.stringify(
        {
          name: '@test/server',
          dependencies: { express: '^4.21.0', cors: '^2.8.5' },
          devDependencies: { '@types/express': '^5.0.0', '@types/cors': '^2.8.0' },
          scripts: {
            dev: 'bun run --watch src/server.ts',
            build: 'tsc',
            start: 'node dist/server.js',
          },
        },
        null,
        2,
      ),
    )
    // Mock tRPC trpc.ts
    await writeFile(
      join(tempDir, 'apps/server/src/modules/trpc/trpc.ts'),
      'import { createExpressMiddleware } from "@trpc/server/adapters/express"\n',
    )
    // Mock tRPC index.ts
    await writeFile(
      join(tempDir, 'packages/trpc/src/index.ts'),
      'export { expressMiddleWare } from "./middleware"\n',
    )
    // Mock Express-only artifacts removed by hono-bun transform
    await writeFile(
      join(tempDir, 'apps/server/src/vercel-handler.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/common/validate.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/trpc/trpc.routes.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/admin/admin.routes.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/admin/admin.controller.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/admin/admin.service.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/auth/auth.routes.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/health/health.routes.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/health/health.controller.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/root/root.routes.ts'),
      'import express from "express"\n',
    )
    await writeFile(
      join(tempDir, 'apps/server/src/modules/root/root.controller.ts'),
      'import express from "express"\n',
    )
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('does nothing for express-bun (default)', async () => {
    const originalApp = await readFile(join(tempDir, 'apps/server/src/app.ts'), 'utf8')
    await applyBackendTransform(tempDir, makeConfig({ backend: 'express-bun' }))
    const afterApp = await readFile(join(tempDir, 'apps/server/src/app.ts'), 'utf8')
    expect(afterApp).toBe(originalApp)
  })

  describe('hono-bun', () => {
    it('rewrites app.ts with Hono imports', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const content = await readFile(join(tempDir, 'apps/server/src/app.ts'), 'utf8')
      expect(content).toContain("import { Hono } from 'hono'")
      expect(content).toContain("import { cors } from 'hono/cors'")
      expect(content).not.toContain('express')
    })

    it('rewrites server.ts with Bun.serve', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const content = await readFile(join(tempDir, 'apps/server/src/server.ts'), 'utf8')
      expect(content).toContain('Bun.serve')
      expect(content).toContain('app.fetch')
    })

    it('removes Express middleware directories', async () => {
      expect(await pathExists(join(tempDir, 'apps/server/src/common/middleware'))).toBe(true)
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      expect(await pathExists(join(tempDir, 'apps/server/src/common/middleware'))).toBe(false)
    })

    it('patches server package.json (adds hono, removes express/cors)', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const pkg = JSON.parse(await readFile(join(tempDir, 'apps/server/package.json'), 'utf8'))
      expect(pkg.dependencies.hono).toBeDefined()
      expect(pkg.dependencies.express).toBeUndefined()
      expect(pkg.dependencies.cors).toBeUndefined()
      expect(pkg.devDependencies['@types/express']).toBeUndefined()
      expect(pkg.devDependencies['@types/cors']).toBeUndefined()
    })

    it('patches server scripts for Bun build', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const pkg = JSON.parse(await readFile(join(tempDir, 'apps/server/package.json'), 'utf8'))
      expect(pkg.scripts.build).toContain('bun build')
      expect(pkg.scripts.start).toContain('dist/server.js')
    })

    it('rewrites tRPC for fetch-based context', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const trpcTs = await readFile(join(tempDir, 'apps/server/src/modules/trpc/trpc.ts'), 'utf8')
      expect(trpcTs).toContain('{ headers: Headers }')
      expect(trpcTs).toContain('createTRPCContext')
      expect(trpcTs).not.toContain('createExpressMiddleware')
      expect(trpcTs).not.toContain('CreateExpressContextOptions')
    })

    it('rewrites tRPC index.ts to client contract types only', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const indexTs = await readFile(join(tempDir, 'packages/trpc/src/index.ts'), 'utf8')
      expect(indexTs).toContain('AppRouter')
      expect(indexTs).toContain('RouterInputs')
      expect(indexTs).not.toContain('expressMiddleWare')
      expect(indexTs).not.toContain('createCaller')
    })

    it('app.ts mounts auth, trpc, health, and 404 routes', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const content = await readFile(join(tempDir, 'apps/server/src/app.ts'), 'utf8')
      expect(content).toContain('/api/auth/*')
      expect(content).toContain('/api/trpc/*')
      expect(content).toContain('/health')
      expect(content).toContain('Not found')
    })

    it('tRPC context includes session and db', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const trpcTs = await readFile(join(tempDir, 'apps/server/src/modules/trpc/trpc.ts'), 'utf8')
      expect(trpcTs).toContain('session')
      expect(trpcTs).toContain('db')
      expect(trpcTs).toContain('auth.api.getSession')
    })

    it('removes Express-only server artifacts', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      expect(await pathExists(join(tempDir, 'apps/server/src/vercel-handler.ts'))).toBe(false)
      expect(await pathExists(join(tempDir, 'apps/server/src/modules/trpc/trpc.routes.ts'))).toBe(
        false,
      )
      expect(await pathExists(join(tempDir, 'apps/server/src/modules/admin/admin.routes.ts'))).toBe(
        false,
      )
    })

    it('server.ts uses common logger and env', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const serverTs = await readFile(join(tempDir, 'apps/server/src/server.ts'), 'utf8')
      expect(serverTs).toContain('./common/logger.js')
      expect(serverTs).toContain('./common/env.js')
      expect(serverTs).not.toContain('utils/logger')
    })

    it('tRPC context uses common logger', async () => {
      await applyBackendTransform(tempDir, makeConfig({ backend: 'hono-bun' }))
      const trpcTs = await readFile(join(tempDir, 'apps/server/src/modules/trpc/trpc.ts'), 'utf8')
      expect(trpcTs).toContain('../common/logger.js')
      expect(trpcTs).not.toContain('backend-common/logger')
      expect(trpcTs).not.toContain('fromNodeHeaders')
    })
  })
})

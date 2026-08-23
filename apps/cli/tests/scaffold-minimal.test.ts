import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createProject } from '../src/lib/create'
import type { ProjectConfig } from '../src/types/schemas'

function makeConfig(destinationDir: string, overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'minimal-scaffold',
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
    includeLiveDemo: false,
    includeDocker: false,
    includeCi: false,
    initializeGit: false,
    installDependencies: false,
    presets: [],
    rustAuth: 'placeholder',
    ...overrides,
  }
}

function readScaffolded(relativePath: string, root: string): string {
  const filePath = join(root, relativePath)
  expect(existsSync(filePath)).toBe(true)
  return readFileSync(filePath, 'utf8')
}

function assertNoLiveDemoLeaks(root: string): void {
  const authRoutes = readScaffolded('apps/server/src/modules/auth/auth.routes.ts', root)
  expect(authRoutes).not.toContain('/sign-in/anonymous')

  const serverTs = readScaffolded('apps/server/src/server.ts', root)
  expect(serverTs).not.toContain('LATTICE_ROUND_ENGINE')

  const envTs = readScaffolded('packages/backend-common/src/env.ts', root)
  expect(envTs).not.toContain('DEMO_AUTO_SIGN_IN')

  const rateLimit = readScaffolded('apps/server/src/common/middleware/rate-limit.ts', root)
  expect(rateLimit).not.toContain('anonymousSignInRateLimit')
  expect(rateLimit).not.toContain('chatStreamRateLimit')

  const publicDto = readScaffolded('apps/server/src/modules/common/public-dto.ts', root)
  expect(publicDto).not.toContain('toPublicMessage')
  expect(publicDto).not.toContain('@arche-template/auth/guest-display-name')

  expect(
    existsSync(join(root, 'packages/store/prisma/migrations/20260625050000_relay_lattice')),
  ).toBe(false)
}

describe('minimal fullstack scaffold structure', () => {
  it('default scaffold has no live-demo imports in core server paths', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-minimal-'))
    const destinationDir = join(tmpRoot, 'default')
    try {
      const result = await createProject({
        config: makeConfig(destinationDir),
        dryRun: false,
      })
      expect(result.success).toBe(true)
      assertNoLiveDemoLeaks(destinationDir)

      const auth = readScaffolded('packages/auth/src/index.ts', destinationDir)
      expect(auth).toContain("autoSignIn: process.env.NODE_ENV !== 'production'")
      expect(auth).not.toContain('anonymous')

      expect(existsSync(join(destinationDir, 'apps/web/components/live'))).toBe(false)
      expect(existsSync(join(destinationDir, 'apps/server/src/modules/game'))).toBe(false)

      const webPkg = JSON.parse(readScaffolded('apps/web/package.json', destinationDir)) as {
        dependencies?: Record<string, string>
      }
      expect(webPkg.dependencies?.['@minimal-scaffold/server']).toBeUndefined()
      expect(webPkg.dependencies?.['@arche-template/server']).toBeUndefined()
      expect(webPkg.dependencies?.['@minimal-scaffold/trpc']).toBeDefined()

      const caller = readScaffolded('apps/web/trpc/caller.ts', destinationDir)
      expect(caller).toContain("from '@minimal-scaffold/trpc'")
      expect(caller).not.toContain('/server/trpc')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it('worker scaffold uses registerSchedules without guest cleanup imports', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-minimal-worker-'))
    const destinationDir = join(tmpRoot, 'worker')
    try {
      const result = await createProject({
        config: makeConfig(destinationDir, { includeWorker: true }),
        dryRun: false,
      })
      expect(result.success).toBe(true)
      assertNoLiveDemoLeaks(destinationDir)

      const workerIndex = readScaffolded('apps/worker/src/index.ts', destinationDir)
      expect(workerIndex).toContain('registerSchedules')
      expect(workerIndex).not.toContain('ensureCleanupSchedule')

      const cleanup = readScaffolded('apps/worker/src/jobs/cleanup.ts', destinationDir)
      expect(cleanup).not.toContain('deleteStaleAnonymousUsers')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it('drizzle scaffold keeps drizzle auth after live-demo cleanup', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-minimal-drizzle-'))
    const destinationDir = join(tmpRoot, 'drizzle')
    try {
      const result = await createProject({
        config: makeConfig(destinationDir, { orm: 'drizzle' }),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      const auth = readScaffolded('packages/auth/src/index.ts', destinationDir)
      expect(auth).toContain('drizzleAdapter')
      expect(auth).not.toContain('prismaAdapter(prisma')
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it('hono scaffold strips live-demo server wiring', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-minimal-hono-'))
    const destinationDir = join(tmpRoot, 'hono')
    try {
      const result = await createProject({
        config: makeConfig(destinationDir, { backend: 'hono-bun' }),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      const serverTs = readScaffolded('apps/server/src/server.ts', destinationDir)
      expect(serverTs).not.toContain('LATTICE_ROUND_ENGINE')
      expect(existsSync(join(destinationDir, 'apps/server/src/modules/game'))).toBe(false)
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it('rust-axum scaffold strips live-demo server wiring', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-minimal-rust-'))
    const destinationDir = join(tmpRoot, 'rust')
    try {
      const result = await createProject({
        config: makeConfig(destinationDir, { backend: 'rust-axum' }),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'apps/server/src/modules/game'))).toBe(false)
      expect(existsSync(join(destinationDir, 'apps/server/src/modules/chat'))).toBe(false)
      expect(existsSync(join(destinationDir, 'services/api'))).toBe(true)
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it('live-demo scaffold restores guest worker cleanup and demo modules', async () => {
    const tmpRoot = mkdtempSync(join(tmpdir(), 'arche-live-demo-'))
    const destinationDir = join(tmpRoot, 'live')
    try {
      const result = await createProject({
        config: makeConfig(destinationDir, {
          includeLiveDemo: true,
          includeWorker: true,
          includeShowcase: true,
        }),
        dryRun: false,
      })
      expect(result.success).toBe(true)

      expect(existsSync(join(destinationDir, 'apps/server/src/modules/game'))).toBe(true)
      expect(existsSync(join(destinationDir, 'apps/web/components/live/live-demo.tsx'))).toBe(true)

      const livePage = readScaffolded('apps/web/app/(sandbox)/live/page.tsx', destinationDir)
      expect(livePage).not.toContain('@/components/arche/')
      expect(livePage).not.toContain('live-demo-json-ld')

      const authPkg = readScaffolded('packages/auth/package.json', destinationDir)
      expect(authPkg).toContain('guest-display-name')

      const backendPkg = readScaffolded('packages/backend-common/package.json', destinationDir)
      expect(backendPkg).toContain('demo-policy')

      expect(existsSync(join(destinationDir, 'packages/ui/package.json'))).toBe(true)

      const webPkg = readScaffolded('apps/web/package.json', destinationDir)
      expect(webPkg).toMatch(/\/ui": "workspace:\*"/)

      const webTsconfig = readScaffolded('apps/web/tsconfig.json', destinationDir)
      expect(webTsconfig).toContain('/ui/*')

      const homePage = readScaffolded('apps/web/app/page.tsx', destinationDir)
      if (homePage.includes('href="/live"')) {
        expect(homePage).toContain("import Link from 'next/link'")
      }

      const seed = readScaffolded('packages/store/src/scripts/seed.ts', destinationDir)
      expect(seed).toContain('latticeCell')

      const cleanup = readScaffolded('apps/worker/src/jobs/cleanup.ts', destinationDir)
      expect(cleanup).toContain('deleteStaleAnonymousUsers')

      const schedule = readScaffolded('apps/worker/src/schedule.ts', destinationDir)
      expect(schedule).toContain('stale-anonymous-users')

      expect(
        existsSync(
          join(destinationDir, 'packages/store/prisma/migrations/20260625050000_relay_lattice'),
        ),
      ).toBe(true)
    } finally {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
})

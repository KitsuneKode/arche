import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { smokeApplicability } from '../src/lib/generated-project-smoke'

function withTempDir(run: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'arche-smoke-'))
  try {
    run(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function touch(dir: string, relativePath: string): void {
  const full = join(dir, relativePath)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, '')
}

describe('smokeApplicability', () => {
  it('detects a Next.js health route', () => {
    withTempDir((dir) => {
      touch(dir, 'app/api/health/route.ts')
      expect(smokeApplicability(dir)).toEqual({ applicable: true, kind: 'next' })
    })
  })

  it('detects a TanStack Start health route', () => {
    withTempDir((dir) => {
      touch(dir, 'src/routes/api/health.ts')
      expect(smokeApplicability(dir)).toEqual({ applicable: true, kind: 'tanstack' })
    })
  })

  it('detects a standalone backend health route', () => {
    withTempDir((dir) => {
      touch(dir, 'src/server.ts')
      touch(dir, 'src/modules/health/health.routes.ts')
      expect(smokeApplicability(dir)).toEqual({ applicable: true, kind: 'backend' })
    })
  })

  it('detects a fullstack server', () => {
    withTempDir((dir) => {
      touch(dir, 'apps/server/src/server.ts')
      expect(smokeApplicability(dir)).toEqual({ applicable: true, kind: 'fullstack-server' })
    })
  })

  it('skips projects with no HTTP smoke target', () => {
    withTempDir((dir) => {
      touch(dir, 'package.json')
      const result = smokeApplicability(dir)
      expect(result.applicable).toBe(false)
    })
  })
})

import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { FamilySchema } from '../src/types/schemas'

const TEMPLATES_DIR = join(import.meta.dir, '../src/templates')

// Families that should include production-ready agent/doc/lint files
const PRODUCTION_FILES = ['.env.example', '.oxlintrc.json', 'AGENTS.md']

const FAMILY_DIRS: Record<string, string[]> = {
  fullstack: ['package.json', '.archefiles.json', '.oxlintrc.json'],
  next: ['package.json', 'tsconfig.json', 'next.config.js', ...PRODUCTION_FILES],
  backend: ['package.json', 'tsconfig.json', ...PRODUCTION_FILES],
  convex: ['package.json', 'tsconfig.json', ...PRODUCTION_FILES],
  rust: ['Cargo.toml'],
  polyglot: ['package.json', 'README.md'],
  cli: ['package.json', 'tsconfig.json', ...PRODUCTION_FILES],
  mobile: ['package.json', 'tsconfig.json', 'app.json', 'App.tsx', 'index.js', ...PRODUCTION_FILES],
  solana: ['Cargo.toml', 'Anchor.toml'],
  lib: ['package.json', 'tsconfig.json', ...PRODUCTION_FILES],
  worker: ['package.json', 'tsconfig.json', ...PRODUCTION_FILES],
}

const families = FamilySchema.options

describe('template stubs', () => {
  for (const family of families) {
    describe(family, () => {
      const dir = join(TEMPLATES_DIR, family)

      it('has a template directory', () => {
        expect(existsSync(dir)).toBe(true)
        const stat = statSync(dir)
        expect(stat.isDirectory()).toBe(true)
      })

      const topLevel = FAMILY_DIRS[family]!
      for (const file of topLevel) {
        it(`has required file: ${file}`, () => {
          const filePath = join(dir, file)
          expect(existsSync(filePath)).toBe(true)
          expect(statSync(filePath).isFile()).toBe(true)
        })
      }

      if (topLevel.includes('package.json')) {
        it('has valid parseable package.json', () => {
          const raw = readFileSync(join(dir, 'package.json'), 'utf8')
          expect(() => JSON.parse(raw)).not.toThrow()
          const pkg = JSON.parse(raw)
          expect(pkg).toHaveProperty('name')
          expect(typeof pkg.name).toBe('string')
        })
      }

      if (topLevel.includes('Cargo.toml')) {
        it('has valid Cargo.toml with package section', () => {
          const raw = readFileSync(join(dir, 'Cargo.toml'), 'utf8')
          expect(raw).toContain('[package]')
          expect(raw).toContain('name =')
        })
      }
    })
  }
})

describe('template stub file integrity', () => {
  it('standalone JavaScript templates expose generated quality gates', () => {
    const expectedScriptsByFamily: Record<string, string[]> = {
      backend: ['build', 'check-types'],
      cli: ['build', 'check-types'],
      convex: ['build', 'check-types'],
      lib: ['build', 'check-types'],
      mobile: ['check-types'],
      next: ['build', 'check-types'],
      polyglot: ['build', 'check-types'],
      worker: ['build', 'check-types'],
    }

    for (const [family, scripts] of Object.entries(expectedScriptsByFamily)) {
      const raw = readFileSync(join(TEMPLATES_DIR, family, 'package.json'), 'utf8')
      const pkg = JSON.parse(raw) as { scripts?: Record<string, string> }

      for (const script of scripts) {
        expect(pkg.scripts?.[script]).toBeTruthy()
      }
    }
  })

  it('next has app directory with layout and page', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'next', 'app', 'layout.tsx'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'next', 'app', 'page.tsx'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'next', 'next-env.d.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'next', 'public', '.gitkeep'))).toBe(true)
  })

  it('fullstack has an explicit package-owned template', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'fullstack', 'apps', 'web', 'app', 'page.tsx'))).toBe(
      true,
    )
    expect(existsSync(join(TEMPLATES_DIR, 'fullstack', 'apps', 'server', 'src', 'app.ts'))).toBe(
      true,
    )
    expect(existsSync(join(TEMPLATES_DIR, 'fullstack', 'packages', 'store', 'package.json'))).toBe(
      true,
    )
  })

  it('backend has src directory with app.ts and server.ts', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'backend', 'src', 'app.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'backend', 'src', 'server.ts'))).toBe(true)
  })

  it('convex has app/ and convex/ directories', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'convex', 'app', 'layout.tsx'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'convex', 'app', 'page.tsx'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'convex', 'app', 'providers.tsx'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'convex', 'convex', 'auth.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'convex', 'convex', 'posts.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'convex', 'convex', 'schema.ts'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'convex', 'convex.json'))).toBe(true)
  })

  it('rust has src/ with main.rs', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'rust', 'src', 'main.rs'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'rust', 'src', 'app.rs'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'rust', 'src', 'modules', 'posts', 'service.rs'))).toBe(
      true,
    )
  })

  it('solana has src/ with lib.rs', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'solana', 'src', 'lib.rs'))).toBe(true)
  })

  it('polyglot has apps/ subdirectories', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'polyglot', 'apps', 'web', 'package.json'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'polyglot', 'apps', 'api', 'package.json'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'polyglot', 'apps', 'worker', 'package.json'))).toBe(true)
  })

  it('cli has src/ with index.ts', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'cli', 'src', 'index.ts'))).toBe(true)
  })

  it('lib has src/ with index.ts', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'lib', 'src', 'index.ts'))).toBe(true)
  })

  it('worker has src/ with index.ts', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'worker', 'src', 'index.ts'))).toBe(true)
  })

  it('mobile has App.tsx at root', () => {
    expect(existsSync(join(TEMPLATES_DIR, 'mobile', 'App.tsx'))).toBe(true)
    expect(existsSync(join(TEMPLATES_DIR, 'mobile', 'index.js'))).toBe(true)
  })
})

import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const TEMPLATES_DIR = join(import.meta.dir, '../src/templates')
const WEB_CORE = join(TEMPLATES_DIR, '_web-core')

const SHARED_PIN_KEYS = [
  'next',
  'react',
  'react-dom',
  '@types/react',
  '@types/react-dom',
  'typescript',
] as const

const WEB_SURFACES = [
  'next/package.json',
  'fullstack/apps/web/package.json',
  'convex/package.json',
  'polyglot/apps/web/package.json',
] as const

function readPackageJson(relativePath: string) {
  return JSON.parse(readFileSync(join(TEMPLATES_DIR, relativePath), 'utf8')) as {
    type?: string
    scripts?: Record<string, string>
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
}

function pinValue(pkg: ReturnType<typeof readPackageJson>, key: string): string | undefined {
  return pkg.dependencies?.[key] ?? pkg.devDependencies?.[key]
}

describe('web core conventions', () => {
  it('keeps shared version pins aligned across all web surfaces', () => {
    const canonical = readPackageJson('next/package.json')

    for (const surface of WEB_SURFACES) {
      const pkg = readPackageJson(surface)
      for (const key of SHARED_PIN_KEYS) {
        const canonicalValue = pinValue(canonical, key)
        const surfaceValue = pinValue(pkg, key)
        if (canonicalValue && surfaceValue) {
          expect(surfaceValue).toBe(canonicalValue)
        }
      }
    }
  })

  it('keeps shared standalone conventions on the next template', () => {
    const next = readPackageJson('next/package.json')

    expect(next.type).toBe('module')
    expect(next.scripts?.dev).toContain('--turbopack')
    expect(next.scripts?.['check-types']).toBeTruthy()
    expect(next.scripts?.lint).toBeTruthy()
  })

  it('keeps shared monorepo web conventions on fullstack web', () => {
    const web = readPackageJson('fullstack/apps/web/package.json')

    expect(web.type).toBe('module')
    expect(web.scripts?.dev).toContain('--turbopack')
    expect(web.scripts?.['check-types']).toBeTruthy()
    expect(web.scripts?.lint).toBeTruthy()
  })

  it('syncs App Router boundaries from _web-core into web templates', () => {
    for (const surface of ['next', 'convex', 'fullstack/apps/web', 'polyglot/apps/web']) {
      for (const file of ['error.tsx', 'loading.tsx', 'not-found.tsx']) {
        const path = join(TEMPLATES_DIR, surface, 'app', file)
        expect(existsSync(path)).toBe(true)
        const content = readFileSync(path, 'utf8')
        const canonical = readFileSync(join(WEB_CORE, 'app', file), 'utf8')
        expect(content).toBe(canonical)
      }
    }
  })

  it('uses ES2022 standalone tsconfig on convex and polyglot web', () => {
    for (const surface of ['convex/tsconfig.json', 'polyglot/apps/web/tsconfig.json']) {
      const tsconfig = JSON.parse(readFileSync(join(TEMPLATES_DIR, surface), 'utf8')) as {
        compilerOptions: { target?: string }
      }
      expect(tsconfig.compilerOptions.target).toBe('ES2022')
    }
  })
})

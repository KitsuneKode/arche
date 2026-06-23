import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = join(import.meta.dir, '../../..')

describe('root package.json scripts', () => {
  it('does not define the removed repo:doctor:ci alias', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(pkg.scripts['repo:doctor:ci']).toBeUndefined()
    expect(pkg.scripts['check:cli']).toBeDefined()
    expect(pkg.scripts['check:web']).toBeDefined()
    expect(pkg.scripts['ci:full']).toBeDefined()
  })

  it('pins only-allow and uses bunx in preinstall', () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
      devDependencies: Record<string, string>
    }
    expect(pkg.devDependencies['only-allow']).toBeDefined()
    expect(pkg.scripts.preinstall).toBe('bunx only-allow bun')
  })
})

describe('packages/common package.json', () => {
  it('does not ship a failing test stub', () => {
    const pkg = JSON.parse(
      readFileSync(join(repoRoot, 'packages/common/package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> }
    expect(pkg.scripts?.test).toBeUndefined()
  })
})

import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = join(import.meta.dir, '../../..')

type ServerTurboTask = {
  inputs?: string[]
}

type ServerTurboConfig = {
  tasks: Record<string, ServerTurboTask>
}

describe('server Turbo cache configuration', () => {
  it('invalidates server bundles when JIT workspace package source changes', () => {
    const config = JSON.parse(
      readFileSync(join(repoRoot, 'apps/server/turbo.json'), 'utf8'),
    ) as ServerTurboConfig
    const buildInputs = config.tasks.build?.inputs ?? []
    const vercelInputs = config.tasks['build:vercel']?.inputs ?? []

    expect(buildInputs).toContain('$TURBO_ROOT$/packages/*/src/**')
    expect(buildInputs).toContain('$TURBO_ROOT$/packages/*/package.json')
    expect(buildInputs).toContain('$TURBO_EXTENDS$')

    expect(vercelInputs).toContain('$TURBO_ROOT$/packages/*/src/**')
    expect(vercelInputs).toContain('$TURBO_ROOT$/packages/*/package.json')
    expect(vercelInputs).toContain('$TURBO_DEFAULT$')
  })
})

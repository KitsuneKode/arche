import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = join(import.meta.dir, '../../..')
const ciWorkflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8')

describe('CI workflow scaffold verification', () => {
  it('runs parallel verify-fast, verify-scaffold, and verify-extras jobs', () => {
    expect(ciWorkflow).toContain('verify-fast:')
    expect(ciWorkflow).toContain('verify-scaffold:')
    expect(ciWorkflow).toContain('verify-extras:')
    expect(ciWorkflow).toContain('name: Verify (fast)')
    expect(ciWorkflow).toContain('name: Verify (scaffold)')
    expect(ciWorkflow).toContain('name: Verify (extras)')
  })

  it('runs the combo matrix exactly once and does not duplicate fullstack verify', () => {
    expect(ciWorkflow).not.toContain('verify:generated:fullstack')
    expect(ciWorkflow.match(/--combo-matrix/g)?.length).toBe(1)
  })

  it('verifies next-app with pnpm install and build in verify-extras', () => {
    expect(ciWorkflow).toContain('Verify next-app with pnpm')
    expect(ciWorkflow).toContain('--preset=next-app --pm=pnpm --run=install,build')
  })

  it('does not set SCAFFOLD_E2E on the combo-matrix step (verify script is the CI gate)', () => {
    const comboStep = ciWorkflow.slice(
      ciWorkflow.indexOf('Verify fullstack combo matrix'),
      ciWorkflow.indexOf('verify-extras:'),
    )
    expect(comboStep).not.toContain('SCAFFOLD_E2E:')
  })

  it('runs tests via bun run test in verify-fast', () => {
    const fastJob = ciWorkflow.slice(
      ciWorkflow.indexOf('verify-fast:'),
      ciWorkflow.indexOf('verify-scaffold:'),
    )
    expect(fastJob).toContain('run: bun run test')
  })
})

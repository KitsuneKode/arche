import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = join(import.meta.dir, '../../..')
const ciWorkflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8')

describe('CI workflow scaffold verification', () => {
  it('runs the combo matrix exactly once and does not duplicate fullstack verify', () => {
    expect(ciWorkflow).not.toContain('verify:generated:fullstack')
    expect(ciWorkflow.match(/--combo-matrix/g)?.length).toBe(1)
  })

  it('verifies next-app with pnpm install and build', () => {
    expect(ciWorkflow).toContain('Verify next-app with pnpm')
    expect(ciWorkflow).toContain('--preset=next-app --pm=pnpm --run=install,build')
  })

  it('does not set SCAFFOLD_E2E on the combo-matrix step (verify script is the CI gate)', () => {
    const comboStep = ciWorkflow.slice(
      ciWorkflow.indexOf('Verify fullstack combo matrix'),
      ciWorkflow.indexOf('Verify next-app with pnpm'),
    )
    expect(comboStep).not.toContain('SCAFFOLD_E2E:')
  })

  it('runs tests via bun run test so template path ignores apply', () => {
    expect(ciWorkflow).toContain('run: bun run test')
  })
})

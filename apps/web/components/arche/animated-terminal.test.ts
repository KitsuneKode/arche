import { describe, expect, it } from 'bun:test'

import { terminalSteps } from '@/components/arche/animated-terminal'
import { CLI_VERSION } from '@/lib/cli-version'
import cliPackage from '../../../cli/package.json'

describe('AnimatedTerminal', () => {
  it('uses non-interactive --yes flow without fictional prompts', () => {
    const joined = terminalSteps.map((s) => s.text).join('\n')
    expect(joined).not.toContain('v3.0.0')
    expect(joined).not.toContain('Add Rust workspace')
    expect(joined).not.toContain('Validating generated project')
    expect(joined).not.toContain('? Package manager')
    expect(joined).toContain('--yes')
  })

  it('exposes CLI version matching apps/cli package.json', () => {
    expect(CLI_VERSION).toBe(cliPackage.version)
  })
})

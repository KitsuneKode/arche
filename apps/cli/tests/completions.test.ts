import { describe, expect, it } from 'bun:test'
import { CLI_PRESETS } from '../src/lib/cli-constants'
import { renderBashCompletion, renderZshCompletion } from '../src/lib/completions'
import { PresetSchema } from '../src/types/schemas'

describe('shell completions', () => {
  it('includes every preset from PresetSchema', () => {
    for (const preset of PresetSchema.options) {
      expect(CLI_PRESETS).toContain(preset)
    }
  })

  it('renders bash completion with preset words', () => {
    const bash = renderBashCompletion()
    expect(bash).toContain('rust-fullstack')
    expect(bash).toContain('typescript-fullstack')
    expect(bash).toContain('solana-product')
  })

  it('renders zsh completion with preset words', () => {
    const zsh = renderZshCompletion()
    expect(zsh).toContain('convex-product')
    expect(zsh).not.toContain('"npm"')
  })
})

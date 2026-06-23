import { describe, expect, it } from 'bun:test'
import { PRESETS } from '../src/registry/presets'
import {
  PRESET_VERIFICATION_MATRIX,
  presetHasStableEvidence,
} from '../src/registry/verification-matrix'

const STABLE_PRESET_IDS = [
  'typescript-fullstack',
  'next-app',
  'rust-api',
  'rust-fullstack',
  'convex-product',
  'solana-program',
  'solana-web',
  'solana-mobile',
  'solana-product',
  'tui-app',
  'tanstack-start',
] as const

describe('preset verification matrix', () => {
  it('has an evidence row for every preset', () => {
    expect(Object.keys(PRESET_VERIFICATION_MATRIX).sort()).toEqual(
      PRESETS.map((preset) => preset.id).sort(),
    )
  })

  it('keeps every non-stable preset below stable evidence threshold', () => {
    for (const preset of PRESETS) {
      if (preset.status === 'stable') {
        expect(presetHasStableEvidence(preset.id)).toBe(true)
      } else {
        expect(presetHasStableEvidence(preset.id)).toBe(false)
      }
    }
  })

  it('marks graduated presets as stable with matching evidence', () => {
    for (const id of STABLE_PRESET_IDS) {
      const preset = PRESETS.find((candidate) => candidate.id === id)
      expect(preset?.status).toBe('stable')
      expect(presetHasStableEvidence(id)).toBe(true)
    }
  })

  it('keeps customize and experiments non-stable', () => {
    expect(PRESETS.find((preset) => preset.id === 'customize')?.status).toBe('requiresValidation')
    expect(PRESETS.find((preset) => preset.id === 'experiments')?.status).toBe('experimental')
    expect(presetHasStableEvidence('customize')).toBe(false)
    expect(presetHasStableEvidence('experiments')).toBe(false)
  })

  it('records Rust fullstack JS + cargo evidence', () => {
    expect(PRESET_VERIFICATION_MATRIX['rust-fullstack']).toMatchObject({
      structure: true,
      cargoWorkspace: true,
      bun: true,
      generatedInstall: true,
      generatedTypecheck: true,
      generatedLint: true,
      generatedBuild: true,
      rustQualityGates: true,
    })
  })

  it('records Convex product evidence', () => {
    expect(PRESET_VERIFICATION_MATRIX['convex-product']).toMatchObject({
      structure: true,
      bun: true,
      convexBackend: true,
      generatedInstall: true,
      generatedTypecheck: true,
      generatedLint: true,
      generatedBuild: true,
      docs: true,
      agentContext: true,
    })
  })

  it('records Solana preset evidence', () => {
    for (const preset of STABLE_PRESET_IDS.filter((id) => id.startsWith('solana-'))) {
      expect(PRESET_VERIFICATION_MATRIX[preset]).toMatchObject({
        structure: true,
        bun: true,
        generatedInstall: true,
        generatedTypecheck: true,
        generatedLint: true,
        generatedBuild: true,
        solanaProgram: true,
      })
    }
  })
})

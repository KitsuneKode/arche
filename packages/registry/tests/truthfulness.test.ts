import { describe, expect, it } from 'bun:test'
import { PRESETS } from '../src/presets'
import {
  PRESET_VERIFICATION_MATRIX,
  VERIFICATION_MATRIX_COLUMNS,
  presetHasStableEvidence,
  type PresetVerificationEvidence,
} from '../src/verification-matrix'

const NON_MATRIX_CAPABILITIES = new Set([
  'web',
  'api',
  'database',
  'auth',
  'generated-client',
  'anchor-tests',
  'web-wallet',
  'mobile-wallet',
  'mobile',
])

const CAPABILITY_EVIDENCE: Record<string, keyof PresetVerificationEvidence> = {
  convex: 'convexBackend',
  'solana-program': 'solanaProgram',
  tui: 'tui',
}

describe('registry truthfulness invariants', () => {
  it('backs every declared capability with matrix evidence or an allow-list', () => {
    for (const preset of PRESETS) {
      for (const capability of preset.capabilities) {
        const evidenceKey = CAPABILITY_EVIDENCE[capability]
        if (evidenceKey) {
          expect(PRESET_VERIFICATION_MATRIX[preset.id][evidenceKey]).toBe(true)
          continue
        }

        expect(NON_MATRIX_CAPABILITIES.has(capability)).toBe(true)
      }
    }
  })

  it('keeps every verification column true for at least one preset', () => {
    for (const column of VERIFICATION_MATRIX_COLUMNS) {
      const hasTrue = PRESETS.some((preset) => PRESET_VERIFICATION_MATRIX[preset.id][column.key])
      expect(hasTrue).toBe(true)
    }
  })

  it('keeps preset status aligned with stable evidence', () => {
    for (const preset of PRESETS) {
      if (preset.status === 'stable') {
        expect(presetHasStableEvidence(preset.id)).toBe(true)
      } else {
        expect(presetHasStableEvidence(preset.id)).toBe(false)
      }
    }
  })

  it('registers next-app, tui-app, and tanstack-start with honest capabilities', () => {
    expect(PRESETS.find((preset) => preset.id === 'next-app')?.capabilities).toEqual(['web'])
    expect(PRESETS.find((preset) => preset.id === 'tui-app')?.capabilities).toEqual(['tui'])
    expect(PRESETS.find((preset) => preset.id === 'tanstack-start')?.capabilities).toEqual(['web'])
    expect(PRESET_VERIFICATION_MATRIX['next-app'].generatedBuild).toBe(true)
    expect(PRESET_VERIFICATION_MATRIX['next-app'].runtimeSmoke).toBe(true)
    expect(PRESET_VERIFICATION_MATRIX['tui-app'].tui).toBe(true)
    expect(PRESET_VERIFICATION_MATRIX['tanstack-start'].runtimeSmoke).toBe(true)
  })
})

import { describe, expect, it } from 'bun:test'

import { PRESET_VERIFICATION_MATRIX, PRESETS } from '@arche-template/registry'
import {
  columnsForPresets,
  RegistryEvidenceTable,
} from '@/components/arche/registry-evidence-table'

describe('RegistryEvidenceTable', () => {
  it('filters out columns with no true evidence across product presets', () => {
    const productPresets = PRESETS.filter((p) => p.id !== 'customize' && p.id !== 'experiments')
    const columns = columnsForPresets(productPresets, 'nonempty')
    const columnKeys = columns.map((c) => c.key)

    // rust-api has no generatedInstall — column should be omitted when no preset has it
    const rustApi = PRESET_VERIFICATION_MATRIX['rust-api']
    if (!rustApi.generatedInstall) {
      expect(columnKeys.includes('generatedInstall')).toBe(
        productPresets.some((p) => PRESET_VERIFICATION_MATRIX[p.id].generatedInstall),
      )
    }
  })

  it('exports RegistryEvidenceTable component', () => {
    expect(typeof RegistryEvidenceTable).toBe('function')
  })

  it('summary policy keeps graduation columns only', () => {
    const productPresets = PRESETS.filter((p) => p.id !== 'customize' && p.id !== 'experiments')
    const columns = columnsForPresets(productPresets, 'summary')
    const columnKeys = columns.map((c) => c.key)

    expect(columnKeys).toContain('generatedBuild')
    expect(columnKeys).not.toContain('bun')
    expect(columnKeys).not.toContain('docs')
    expect(columns.length).toBeLessThanOrEqual(9)
  })
})

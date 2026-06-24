'use client'

import { RegistryEvidenceTable } from '@/components/arche/registry-evidence-table'

function productPresetFilter(id: string) {
  return id !== 'customize' && id !== 'experiments'
}

export function VerificationMatrixTable() {
  return (
    <RegistryEvidenceTable
      presetFilter={productPresetFilter}
      columnPolicy="nonempty"
      absentGlyph="dash"
      variant="marketing"
    />
  )
}

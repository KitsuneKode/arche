import { RegistryEvidenceTable } from '@/components/arche/registry-evidence-table'

function productPresetFilter(id: string) {
  return id !== 'customize' && id !== 'experiments'
}

export function VerificationMatrixTable() {
  return (
    <RegistryEvidenceTable
      presetFilter={productPresetFilter}
      columnPolicy="summary"
      absentGlyph="dash"
      variant="marketing"
      caption="Graduation checks per preset. Scroll horizontally on small screens — full matrix lives in the docs."
    />
  )
}

import Link from 'next/link'

import { RegistryEvidenceTable } from '@/components/arche/registry-evidence-table'

export function VerificationMatrixTable() {
  return (
    <RegistryEvidenceTable
      columnPolicy="nonempty"
      absentGlyph="dash"
      variant="docs"
      caption={
        <>
          Evidence recorded in the CLI registry. A preset becomes{' '}
          <strong className="text-white">Stable</strong> when{' '}
          <code className="text-zinc-300">presetHasStableEvidence</code> passes for that
          preset&apos;s route (not every column applies to every stack). See{' '}
          <Link
            href="/docs/guides/verification-and-presets"
            className="text-white underline underline-offset-2"
          >
            verification guide
          </Link>
          .
        </>
      }
    />
  )
}

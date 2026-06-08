import Link from 'next/link'

import { FamilyTable } from '@/components/arche/family-table'
import { presetsHeroEyebrow } from '@/components/arche/hero-eyebrows'
import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SectionHeading, SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { VerificationMatrixTable } from '@/components/arche/verification-matrix-table'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Architecture Families',
  description: 'Compare Arche presets, capabilities, and verification evidence before scaffolding.',
  path: '/families',
})

export default function FamiliesPage() {
  return (
    <SiteShell>
      <Navbar />

      <SiteFrame>
        <HeroBlock
          eyebrow={presetsHeroEyebrow}
          title="Choose a route,"
          accent="not a vibe."
          size="md"
        >
          Pick the architecture first—TypeScript fullstack, Convex + Next.js, Rust API, Solana web,
          and others. The CLI generates scopes, docs, and verification hooks that match that route.
          No preset is marked Stable until the verification matrix proves it.
        </HeroBlock>

        <section className="flex-1 space-y-16 bg-black p-6 md:p-16">
          <FamilyTable />

          <div>
            <SectionHeading eyebrow="Evidence" title="Verification matrix">
              <p className="max-w-2xl text-sm text-zinc-500">
                Code guard in <code className="text-zinc-400">packages/registry</code>. Guide:{' '}
                <Link
                  href="/docs/guides/verification-and-presets"
                  className="text-sky-400 underline"
                >
                  verification and presets
                </Link>
                .
              </p>
            </SectionHeading>
            <VerificationMatrixTable />
          </div>
        </section>
      </SiteFrame>
    </SiteShell>
  )
}

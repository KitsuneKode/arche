import Link from 'next/link'
import { Suspense } from 'react'

import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SiteFrame, SiteShell, StatusPill } from '@/components/arche/site-primitives'
import { PlayPanels } from '@/components/play/play-panels'
import { LiveDemoFallback } from '@/components/sandbox/live-demo-fallback'
import { LiveSandboxHydrator } from '@/components/sandbox/live-sandbox-hydrator'
import { PlayJsonLd } from '@/components/seo/play-json-ld'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Relay — live chat and stack ping',
  description:
    'Lightweight Arche stack demo: real-time chat via tRPC, SSE/poll fallback, and API latency pings against the demo API.',
  path: '/play',
  keywords: ['tRPC', 'live chat', 'SSE', 'Better Auth', 'fullstack demo', 'Next.js'],
})

export default function PlayPage() {
  return (
    <SiteShell>
      <PlayJsonLd />
      <Navbar />

      <SiteFrame>
        <HeroBlock eyebrow="Relay" title="Chat and ping" accent=" the stack." size="md">
          A focused sandbox for real-time chat and API latency — fewer panels than{' '}
          <Link href="/live" className="text-white underline underline-offset-4">
            /live
          </Link>
          , same tRPC contract.
        </HeroBlock>

        <section className="border-b border-zinc-800 px-6 py-4 md:px-16">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="muted">tRPC</StatusPill>
            <StatusPill tone="muted">SSE / poll</StatusPill>
            <StatusPill tone="muted">Better Auth</StatusPill>
          </div>
        </section>

        <section className="flex-1 bg-black p-6 md:p-16">
          <Suspense fallback={<LiveDemoFallback label="Loading Relay…" />}>
            <LiveSandboxHydrator prefetchChat>
              <PlayPanels />
            </LiveSandboxHydrator>
          </Suspense>
        </section>
      </SiteFrame>
    </SiteShell>
  )
}

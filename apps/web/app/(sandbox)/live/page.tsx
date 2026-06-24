import Link from 'next/link'

import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { LiveDemo } from '@/components/live/live-demo'
import { LiveSandboxHydrator } from '@/components/sandbox/live-sandbox-hydrator'
import { LiveDemoJsonLd } from '@/components/seo/live-demo-json-ld'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Live stack demo — chat, posts, and proof run',
  description:
    'Interactive TypeScript fullstack demo: tRPC, Prisma, Better Auth, public chat, draft posts, and real proof-run checks on arche.dev.',
  path: '/live',
  keywords: [
    'tRPC',
    'Better Auth',
    'Prisma',
    'live demo',
    'fullstack TypeScript',
    'Next.js',
    'Express',
  ],
})

export default function LivePage() {
  return (
    <SiteShell>
      <LiveDemoJsonLd />
      <Navbar />

      <SiteFrame>
        <HeroBlock eyebrow="Live sandbox" title="Try the stack" accent=" live." size="md">
          Chat, posts, and proof-run checks against the demo API — not illustrative snippets. Sign
          in to unlock write access and optional challenges. For a lighter demo, try{' '}
          <Link href="/play" className="text-white underline underline-offset-4">
            Relay
          </Link>
          .
        </HeroBlock>

        <section className="flex-1 bg-black p-6 md:p-16">
          <LiveSandboxHydrator>
            <LiveDemo />
          </LiveSandboxHydrator>
        </section>
      </SiteFrame>
    </SiteShell>
  )
}

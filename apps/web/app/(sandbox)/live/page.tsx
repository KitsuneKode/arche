import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { LiveDemo } from '@/components/live/live-demo'
import { LiveDemoJsonLd } from '@/components/seo/live-demo-json-ld'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Live stack demo — Relay Lattice, chat, and proof run',
  description:
    'Interactive TypeScript fullstack demo: Relay Lattice multiplayer clashes, tRPC, SSE, Prisma, Better Auth, and proof-run checks on arche.dev.',
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
        <HeroBlock eyebrow="Live sandbox" title="Relay Lattice" accent=" live." size="md">
          Pick a side in binary clashes, light the shared grid, and chat in one SSE-powered room.
          Sign in to vote and post. Proof-run checks run on the left.
        </HeroBlock>

        <section className="flex-1 bg-black p-6 md:p-16">
          <LiveDemo />
        </section>
      </SiteFrame>
    </SiteShell>
  )
}

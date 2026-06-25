import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { LiveDemo } from '@/components/live/live-demo'
import { LiveDemoJsonLd } from '@/components/seo/live-demo-json-ld'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Live stack demo — Relay Run, chat, and proof run',
  description:
    'Interactive TypeScript fullstack demo: Relay Run mini-game with leaderboard, tRPC, SSE, Prisma, Better Auth, and proof-run checks on arche.dev.',
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
        <HeroBlock eyebrow="Live sandbox" title="Relay Run" accent=" live." size="md">
          Play the Flappy-style relay game, climb the leaderboard, and chat via the #relay popup.
          Sign in to save scores and post. Proof-run checks run on the left.
        </HeroBlock>

        <section className="flex-1 bg-black p-6 md:p-16">
          <LiveDemo />
        </section>
      </SiteFrame>
    </SiteShell>
  )
}

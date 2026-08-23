import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { LiveDemoShell } from '@/components/live/live-demo-shell'
import { StackProbeStrip } from '@/components/live/stack-probe-strip'
import { LiveDemoJsonLd } from '@/components/seo/live-demo-json-ld'
import { buildPageMetadata } from '@/lib/seo'
import { HydrateClient, prefetch, trpc, trpcCaller } from '@/trpc/server'

export const metadata = buildPageMetadata({
  title: 'Live stack demo — Relay Run, Stack Lab, and proof run',
  description:
    'Interactive TypeScript fullstack demo: Relay Run mini-game, Stack Lab mini-projects, tRPC + RSC prefetch, SSE chat, Prisma, Better Auth, and proof-run checks on arche.dev.',
  path: '/live',
  keywords: [
    'tRPC',
    'Better Auth',
    'Prisma',
    'live demo',
    'fullstack TypeScript',
    'Next.js',
    'Express',
    'RSC',
  ],
})

export default async function LivePage() {
  await Promise.all([
    prefetch(trpc.chat.list.queryOptions()),
    prefetch(trpc.post.list.queryOptions()),
    prefetch(trpc.game.leaderboard.queryOptions()),
    prefetch(trpc.demo.capabilities.queryOptions()),
    prefetch(trpc.auth.getSession.queryOptions()),
  ])

  const api = await trpcCaller()
  const snapshot = await api.demo.stackSnapshot().catch(() => null)

  return (
    <SiteShell>
      <LiveDemoJsonLd />
      <Navbar />

      <SiteFrame>
        <HeroBlock
          eyebrow="Live sandbox"
          title="Relay Run"
          accent=" live."
          size="md"
          className="!p-4 md:!p-8"
        >
          Play the game, explore Stack Lab mini-projects, or join the room chat — proof checks
          below.
        </HeroBlock>

        {snapshot ? <StackProbeStrip snapshot={snapshot} /> : null}

        <section className="flex-1 bg-black p-4 md:p-8">
          <HydrateClient>
            <LiveDemoShell initialSnapshot={snapshot} />
          </HydrateClient>
        </section>
      </SiteFrame>
    </SiteShell>
  )
}

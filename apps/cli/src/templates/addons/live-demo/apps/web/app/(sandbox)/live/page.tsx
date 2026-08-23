import type { Metadata } from 'next'

import { LiveDemoShell } from '@/components/live/live-demo-shell'
import { StackProbeStrip } from '@/components/live/stack-probe-strip'
import { HydrateClient, prefetch, trpc, trpcCaller } from '@/trpc/server'

export const metadata: Metadata = {
  title: 'Live stack demo — Relay Run, Stack Lab, and proof run',
  description:
    'Interactive TypeScript fullstack demo: Relay Run mini-game, Stack Lab mini-projects, tRPC + RSC prefetch, SSE chat, Prisma, Better Auth, and proof-run checks.',
}

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
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-4 py-6 md:px-8">
        <p className="text-xs tracking-widest text-zinc-400 uppercase">Live sandbox</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Relay Run <span className="text-zinc-400">live.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Play the game, explore Stack Lab mini-projects, or join the room chat — proof checks
          below.
        </p>
      </header>

      {snapshot ? <StackProbeStrip snapshot={snapshot} /> : null}

      <section className="p-4 md:p-8">
        <HydrateClient>
          <LiveDemoShell initialSnapshot={snapshot} />
        </HydrateClient>
      </section>
    </main>
  )
}

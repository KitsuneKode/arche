import type { Metadata } from 'next'

import { LiveDemo } from '@/components/live/live-demo'

export const metadata: Metadata = {
  title: 'Live stack demo — Relay Run, chat, and proof run',
  description:
    'Interactive TypeScript fullstack demo: Relay Run mini-game with leaderboard, tRPC, SSE, Prisma, Better Auth, and proof-run checks.',
}

export default function LivePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-4 py-6 md:px-8">
        <p className="text-xs uppercase tracking-widest text-zinc-400">Live sandbox</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          Relay Run <span className="text-zinc-400">live.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Tap to play. Chat, posts, and sign-in are in the side panel — proof checks below.
        </p>
      </header>
      <section className="p-4 md:p-8">
        <LiveDemo />
      </section>
    </main>
  )
}

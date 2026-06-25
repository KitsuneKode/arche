import type { Metadata } from 'next'
import Link from 'next/link'

import { LiveDemo } from '@/components/live/live-demo'

export const metadata: Metadata = {
  title: 'Live stack demo — Relay Run, chat, and proof run',
  description:
    'Interactive fullstack demo: Relay Run mini-game with leaderboard, tRPC, SSE, Prisma, Better Auth, and proof-run checks.',
}

export default function LivePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Live sandbox</p>
        <h1>
          Relay Run <span style={{ color: 'var(--color-accent)' }}>live.</span>
        </h1>
        <p className="lede">
          Play the Flappy-style relay game, climb the leaderboard, and chat via the #relay popup.
          Sign in to save scores and post. Proof-run checks run alongside the game.
        </p>
        <div className="actions">
          <Link href="/">← Back to home</Link>
        </div>
      </section>

      <LiveDemo />
    </main>
  )
}

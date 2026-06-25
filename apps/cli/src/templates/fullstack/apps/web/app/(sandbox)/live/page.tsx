import type { Metadata } from 'next'
import Link from 'next/link'

import { LiveDemo } from '@/components/live/live-demo'

export const metadata: Metadata = {
  title: 'Live stack demo — Relay Lattice, chat, and proof run',
  description:
    'Interactive fullstack demo: Relay Lattice clashes, tRPC, SSE, Prisma, Better Auth, and proof-run checks.',
}

export default function LivePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Live sandbox</p>
        <h1>
          Relay Lattice <span style={{ color: 'var(--color-accent)' }}>live.</span>
        </h1>
        <p className="lede">
          Pick a side in binary clashes, light the shared grid, and chat in one SSE-powered room.
          Sign in to vote and post. Proof-run checks run alongside the game.
        </p>
        <div className="actions">
          <Link href="/">← Back to home</Link>
        </div>
      </section>

      <LiveDemo />
    </main>
  )
}

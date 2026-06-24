import type { Metadata } from 'next'
import Link from 'next/link'

import { LiveDemo } from '@/components/live/live-demo'
import { SandboxApiBridge } from '@/components/sandbox/sandbox-api-bridge'

export const metadata: Metadata = {
  title: 'Live stack demo — chat, posts, and proof run',
  description:
    'Interactive fullstack demo: tRPC, Prisma, Better Auth, public chat, draft posts, and proof-run checks.',
}

export default function LivePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Live sandbox</p>
        <h1>
          Try the stack <span style={{ color: 'var(--color-accent)' }}>live.</span>
        </h1>
        <p className="lede">
          Chat, posts, and proof-run checks against your API — not illustrative snippets. Sign in to
          unlock write access and optional challenges.
        </p>
        <div className="actions">
          <Link href="/">← Back to home</Link>
        </div>
      </section>

      <SandboxApiBridge>
        <LiveDemo />
      </SandboxApiBridge>
    </main>
  )
}

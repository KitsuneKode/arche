import type { Metadata } from 'next'
import Link from 'next/link'

import { LiveDemo } from '@/components/live/live-demo'
import config from '@/env'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

export const metadata: Metadata = {
  title: 'Live stack demo — chat, posts, and proof run',
  description:
    'Interactive fullstack demo: tRPC, Prisma, Better Auth, public chat, draft posts, and proof-run checks.',
}

async function isApiReachable() {
  try {
    const response = await fetch(`${config.NEXT_PUBLIC_API_URL}/health`, {
      next: { revalidate: 0 },
    })
    if (!response.ok) return false
    const body = (await response.json()) as { database?: string }
    return body.database === 'connected'
  } catch {
    return false
  }
}

export default async function LivePage() {
  const apiReachable = await isApiReachable()

  if (apiReachable) {
    await Promise.all([
      prefetch(trpc.hello.queryOptions({ name: 'Arche' })),
      prefetch(trpc.post.list.queryOptions()),
      prefetch(trpc.chat.list.queryOptions()),
      prefetch(trpc.auth.getSession.queryOptions()),
      prefetch(trpc.demo.capabilities.queryOptions()),
    ])
  }

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

      <HydrateClient>
        <LiveDemo apiReachable={apiReachable} />
      </HydrateClient>
    </main>
  )
}

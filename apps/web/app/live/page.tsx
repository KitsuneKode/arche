import { Navbar } from '@/components/arche/navbar'
import { HeroBlock, SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { LiveDemo } from '@/components/live/live-demo'
import { LiveDemoJsonLd } from '@/components/seo/live-demo-json-ld'
import config from '@/env'
import { buildPageMetadata } from '@/lib/seo'
import { HydrateClient, prefetch, trpc } from '@/trpc/http-server'

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
    ])
  }

  return (
    <SiteShell>
      <LiveDemoJsonLd />
      <Navbar />

      <SiteFrame>
        <HeroBlock eyebrow="Live sandbox" title="Try the stack" accent=" live." size="md">
          Chat, posts, and proof-run checks against the demo API — not illustrative snippets. Sign
          in to unlock write access and optional challenges.
        </HeroBlock>

        <section className="flex-1 bg-black p-6 md:p-16">
          <HydrateClient>
            <LiveDemo apiReachable={apiReachable} />
          </HydrateClient>
        </section>
      </SiteFrame>
    </SiteShell>
  )
}

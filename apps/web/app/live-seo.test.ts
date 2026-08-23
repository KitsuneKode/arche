import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'

process.env.CI = 'true'
process.env.NEXT_PUBLIC_SITE_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_APP_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_API_URL = 'https://api.arche.kitsunelabs.xyz'

const appRoot = join(import.meta.dir)

function ogImageUrl(
  metadata: Awaited<ReturnType<(typeof import('@/lib/seo'))['buildPageMetadata']>>,
) {
  const ogImage = metadata.openGraph?.images?.[0]
  return ogImage && typeof ogImage === 'object' && 'url' in ogImage ? ogImage.url : ogImage
}

describe('/live SEO', () => {
  it('exports metadata with keywords and route-scoped OG image', async () => {
    const { buildPageMetadata, routeOgImagePath } = await import('@/lib/seo')
    const path = '/live'
    const metadata = buildPageMetadata({
      title: 'Live stack demo — chat, posts, and proof run',
      description:
        'Interactive TypeScript fullstack demo: tRPC, Prisma, Better Auth, public chat, draft posts, and real proof-run checks on arche.dev.',
      path,
      ogImagePath: routeOgImagePath(path),
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

    expect(metadata.title).toContain('Live stack demo')
    expect(metadata.description).toContain('tRPC')
    expect(metadata.keywords).toEqual(
      expect.arrayContaining(['Better Auth', 'Prisma', 'live demo']),
    )
    expect(routeOgImagePath(path)).toBe('/live/opengraph-image')
    expect(String(ogImageUrl(metadata))).toMatch(/\/live\/opengraph-image$/)
  })

  it('live page wires the same metadata contract', () => {
    const source = readFileSync(join(appRoot, '(sandbox)/live/page.tsx'), 'utf8')
    expect(source).toContain('Relay Run')
    expect(source).toContain('LiveDemoJsonLd')
    expect(source).toContain('<LiveDemoShell')
    expect(source).not.toContain('isApiReachable')
  })

  it('redirects /play to /live', () => {
    const source = readFileSync(join(appRoot, '../next.config.js'), 'utf8')
    expect(source).toContain("source: '/play'")
    expect(source).toContain("destination: '/live'")
  })

  it('includes live opengraph image route files', () => {
    const ogRoute = join(appRoot, '(sandbox)/live/opengraph-image.tsx')
    const ogImage = join(appRoot, '../lib/og/routes/live-opengraph.image.tsx')
    expect(readFileSync(ogRoute, 'utf8')).toContain('live-opengraph')
    expect(readFileSync(ogImage, 'utf8')).toContain('Live sandbox')
  })

  it('renders WebApplication JSON-LD', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { LiveDemoJsonLd } = await import('@/components/seo/live-demo-json-ld')

    const html = renderToStaticMarkup(createElement(LiveDemoJsonLd))
    expect(html).toContain('application/ld+json')
    expect(html).toContain('WebApplication')
    expect(html).toContain('/live')
    expect(html).toContain('DeveloperApplication')
  })
})

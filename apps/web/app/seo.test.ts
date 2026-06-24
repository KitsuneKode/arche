import { describe, expect, it } from 'bun:test'

process.env.CI = 'true'
process.env.NEXT_PUBLIC_SITE_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_APP_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_API_URL = 'https://api.arche.kitsunelabs.xyz'

function ogImageUrl(
  metadata: Awaited<ReturnType<(typeof import('@/lib/seo'))['buildPageMetadata']>>,
) {
  const ogImage = metadata.openGraph?.images?.[0]
  return ogImage && typeof ogImage === 'object' && 'url' in ogImage ? ogImage.url : ogImage
}

describe('site SEO metadata', () => {
  it('emits absolute canonical and OG image URLs for blog and docs', async () => {
    const { buildBlogPostMetadata } = await import('@/lib/blog')
    const { blogSource } = await import('@/lib/blog-source')
    const { buildDocsPageMetadata, absoluteSiteUrl } = await import('@/lib/seo')
    const { source } = await import('@/lib/source')

    const blogPage = blogSource.getPage(['changelog-0-2-1'])
    const docsPage = source.getPage(['getting-started'])
    expect(blogPage).toBeDefined()
    expect(docsPage).toBeDefined()
    if (!blogPage || !docsPage) return

    const blog = buildBlogPostMetadata(blogPage)
    const docs = buildDocsPageMetadata(docsPage)

    expect(blog.alternates?.canonical).toBe(absoluteSiteUrl('/blog/changelog-0-2-1'))
    expect(ogImageUrl(blog)).toBe(absoluteSiteUrl('/blog/changelog-0-2-1/opengraph-image'))

    expect(docs.alternates?.canonical).toBe(absoluteSiteUrl('/docs/getting-started'))
    expect(ogImageUrl(docs)).toBe(absoluteSiteUrl('/docs/og/getting-started'))
  })

  it('maps docs breadcrumbs for guides and walkthroughs', async () => {
    const { buildDocsBreadcrumbs } = await import('@/lib/docs-breadcrumbs')

    expect(
      buildDocsBreadcrumbs(['guides', 'first-hour'], 'First hour').map((item) => item.name),
    ).toEqual(['Home', 'Documentation', 'Guides', 'First hour'])

    expect(
      buildDocsBreadcrumbs(['guides', 'walkthrough-rust'], 'Rust walkthrough').map(
        (item) => item.name,
      ),
    ).toEqual(['Home', 'Documentation', 'Walkthroughs', 'Rust walkthrough'])
  })

  it('emits cache-busted favicon and manifest URLs from root layout metadata', async () => {
    const { buildRootLayoutMetadata } = await import('@/lib/seo')
    const { SITE_ICON_VERSION } = await import('@/lib/site-icons')

    const metadata = buildRootLayoutMetadata()
    const icons = metadata.icons
    expect(icons).toBeDefined()
    if (!icons || typeof icons === 'string') return

    const iconEntries = Array.isArray(icons.icon) ? icons.icon : icons.icon ? [icons.icon] : []
    const iconUrls = iconEntries.map((entry) => (typeof entry === 'string' ? entry : entry.url))
    expect(iconUrls).toContain(`/favicon.ico?v=${SITE_ICON_VERSION}`)
    expect(iconUrls).toContain(`/favicon.svg?v=${SITE_ICON_VERSION}`)

    const appleEntries = Array.isArray(icons.apple) ? icons.apple : icons.apple ? [icons.apple] : []
    const appleUrls = appleEntries.map((entry) => (typeof entry === 'string' ? entry : entry.url))
    expect(appleUrls).toContain(`/apple-touch-icon.png?v=${SITE_ICON_VERSION}`)

    expect(metadata.manifest).toBe(`/site.webmanifest?v=${SITE_ICON_VERSION}`)
  })
})

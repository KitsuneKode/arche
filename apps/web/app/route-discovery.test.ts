import { describe, expect, it } from 'bun:test'

process.env.CI = 'true'
process.env.NEXT_PUBLIC_SITE_URL = 'https://arche.test'
process.env.NEXT_PUBLIC_APP_URL = 'https://arche.test'
process.env.NEXT_PUBLIC_API_URL = 'https://api.arche.test'

describe('route discovery controls', () => {
  it('keeps design lab out of public discovery routes', async () => {
    const [{ default: robots }, { buildSitemapEntries }] = await Promise.all([
      import('./robots'),
      import('@/lib/sitemap-data'),
    ])

    const rules = robots().rules
    expect(Array.isArray(rules) ? rules : [rules]).toContainEqual(
      expect.objectContaining({
        disallow: expect.arrayContaining(['/__design-lab/']),
      }),
    )

    const urls = buildSitemapEntries('https://arche.test').map((entry) => entry.url)
    expect(urls).not.toContain('https://arche.test/__design-lab')
    expect(urls).not.toContain('https://arche.test/showcase')
    expect(urls).toContain('https://arche.test/live')
    expect(urls).toContain('https://arche.test/play')
  })
})

import type { MetadataRoute } from 'next'

import { BLOG_CATEGORIES, getBlogFrontmatter } from '@/lib/blog'
import { blogSource } from '@/lib/blog-source'
import { source } from '@/lib/source'

const PUBLIC_ROUTES = ['', '/families', '/live', '/play', '/examples', '/blog', '/rss.xml'] as const

/** Pure sitemap builder — safe in tests and inside `use cache` at runtime. */
export function buildSitemapEntries(base: string): MetadataRoute.Sitemap {
  const siteBase = base.replace(/\/$/, '')

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((path) => ({
    url: `${siteBase}${path}`,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.8,
  }))

  const docsEntries: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${siteBase}${page.url}`,
    changeFrequency: 'monthly' as const,
    priority: page.url === '/docs/getting-started' ? 0.85 : 0.7,
  }))

  const blogEntries: MetadataRoute.Sitemap = blogSource
    .getPages()
    .filter((page) => !getBlogFrontmatter(page).draft)
    .map((page) => {
      const data = getBlogFrontmatter(page)
      const slug = page.slugs[0]
      const lastModified = data.date
        ? new Date(data.date.includes('T') ? data.date : `${data.date}T00:00:00`)
        : undefined

      return {
        url: `${siteBase}/blog/${slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      }
    })

  const blogCategoryEntries: MetadataRoute.Sitemap = BLOG_CATEGORIES.filter(
    (cat) => cat.id !== 'all',
  ).map((cat) => ({
    url: `${siteBase}/blog/category/${cat.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticEntries, ...docsEntries, ...blogEntries, ...blogCategoryEntries]
}

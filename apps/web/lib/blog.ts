import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'

import { blogSource, isBlogCategory, type BlogCategory } from '@/lib/blog-source'
import { absoluteSiteUrl, buildPageMetadata, routeOgImagePath } from '@/lib/seo'

export type BlogPage = ReturnType<typeof blogSource.getPages>[number]

export type BlogPostSummary = {
  slug: string
  url: string
  title: string
  description?: string
  date?: string
  category: BlogCategory
  draft?: boolean
  author?: string
  tags?: string[]
  image?: string
}

export type BlogFrontmatter = BlogPage['data'] & {
  date?: string
  category?: BlogCategory
  draft?: boolean
  image?: string
  author?: string
  tags?: string[]
}

export const BLOG_CATEGORIES = [
  { id: 'all' as const, label: 'All' },
  { id: 'changelog' as const, label: 'Changelog' },
  { id: 'guide' as const, label: 'Guides' },
  { id: 'technical' as const, label: 'Technical' },
]

export function getBlogFrontmatter(page: BlogPage): BlogFrontmatter {
  return page.data as BlogFrontmatter
}

export function getBlogCategory(page: BlogPage): BlogCategory {
  const value = getBlogFrontmatter(page).category
  return isBlogCategory(value) ? value : 'technical'
}

function toBlogPostSummary(page: BlogPage): BlogPostSummary {
  const data = getBlogFrontmatter(page)
  return {
    slug: page.slugs[0] ?? '',
    url: page.url,
    title: data.title ?? 'Untitled',
    description: data.description ?? '',
    date: data.date,
    category: getBlogCategory(page),
    draft: data.draft,
    author: data.author,
    tags: data.tags,
    image: data.image,
  }
}

/** Build-time / RSC list for pages — keep synchronous so blog routes fully prerender. */
export function getPublishedBlogSummariesSync(): BlogPostSummary[] {
  return blogSource
    .getPages()
    .filter((page) => !getBlogFrontmatter(page).draft)
    .map(toBlogPostSummary)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

/** Cached published post metadata — serializable for RSS and list shells. */
export async function getPublishedBlogSummaries(): Promise<BlogPostSummary[]> {
  'use cache'
  cacheLife('max')
  cacheTag('site-content', 'blog')

  return getPublishedBlogSummariesSync()
}

export function filterBlogSummariesByCategory(
  posts: BlogPostSummary[],
  category: BlogCategory | 'all',
): BlogPostSummary[] {
  if (category === 'all') return posts
  return posts.filter((post) => post.category === category)
}

export function blogPostPath(slug: string): string {
  return `/blog/${slug}`
}

export function blogPostAbsoluteUrl(slug: string): string {
  return absoluteSiteUrl(blogPostPath(slug))
}

export function blogPostOgImagePath(slug: string, image?: string): string {
  if (image?.startsWith('http://') || image?.startsWith('https://')) {
    return image
  }
  if (image?.startsWith('/')) {
    return image
  }
  return routeOgImagePath(blogPostPath(slug))
}

/** @deprecated Prefer blogPostOgImagePath(slug) for per-post build-time OG images. */
export function blogOgImagePath(title: string, image?: string): string {
  if (image?.startsWith('http://') || image?.startsWith('https://')) {
    return image
  }
  if (image?.startsWith('/')) {
    return image
  }
  return `/blog/og?title=${encodeURIComponent(title)}`
}

export { absoluteSiteUrl } from '@/lib/seo'

export function blogPostOgAbsoluteUrl(slug: string, image?: string): string {
  return absoluteSiteUrl(blogPostOgImagePath(slug, image))
}

export function formatBlogDate(date: string, options?: { includeRelative?: boolean }): string {
  const iso = date.includes('T') ? date : `${date}T00:00:00`
  const target = new Date(iso)
  const full = target.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!options?.includeRelative) {
    return full
  }

  const now = new Date()
  const years = now.getFullYear() - target.getFullYear()
  const months = now.getMonth() - target.getMonth()
  const days = now.getDate() - target.getDate()

  let relative = 'Today'
  if (years > 0) relative = `${years}y ago`
  else if (months > 0) relative = `${months}mo ago`
  else if (days > 0) relative = `${days}d ago`

  return `${full} (${relative})`
}

export function buildBlogPostMetadata(page: BlogPage): Metadata {
  const data = getBlogFrontmatter(page)
  const slug = page.slugs[0] ?? ''
  const path = blogPostPath(slug)
  return buildPageMetadata({
    title: data.title,
    description: data.description,
    path,
    ogImagePath: blogPostOgImagePath(slug, data.image),
    ogType: 'article',
    publishedTime: data.date,
    keywords: data.tags,
    authors: data.author ? [{ name: data.author }] : [{ name: 'KitsuneKode' }],
  })
}

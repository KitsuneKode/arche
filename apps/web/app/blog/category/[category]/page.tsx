import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlogIndexShell } from '@/components/blog/blog-index-shell'
import { BlogPostFeed } from '@/components/blog/blog-post-feed'
import {
  BLOG_CATEGORIES,
  filterBlogSummariesByCategory,
  getPublishedBlogSummaries,
} from '@/lib/blog'
import { isBlogCategory, type BlogCategory } from '@/lib/blog-source'
import { buildPageMetadata } from '@/lib/seo'

const CATEGORY_META: Record<BlogCategory, { title: string; description: string }> = {
  changelog: {
    title: 'Changelog',
    description: 'Release notes and what shipped in each Arche CLI version.',
  },
  guide: {
    title: 'Guides',
    description: 'How-to posts for scaffolding, presets, and your first hour with Arche.',
  },
  technical: {
    title: 'Technical',
    description: 'Architecture, tooling, and implementation notes from the Arche monorepo.',
  },
}

type Props = {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  const params: { category: string }[] = []

  for (const cat of BLOG_CATEGORIES) {
    if (cat.id !== 'all') {
      params.push({ category: cat.id })
    }
  }

  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  if (!isBlogCategory(category)) {
    return { title: 'Blog category' }
  }

  const meta = CATEGORY_META[category]
  const path = `/blog/category/${category}`

  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path,
  })
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category } = await params
  if (!isBlogCategory(category)) notFound()

  const posts = filterBlogSummariesByCategory(await getPublishedBlogSummaries(), category)

  return (
    <BlogIndexShell activeCategory={category}>
      <BlogPostFeed posts={posts} />
    </BlogIndexShell>
  )
}

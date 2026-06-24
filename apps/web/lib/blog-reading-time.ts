import fs from 'node:fs'
import path from 'node:path'
import { cacheLife, cacheTag } from 'next/cache'

import { countWords, formatReadingTime } from '@/lib/reading-time'

export function readingTimeForBlogSlugSync(slug: string): string {
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`)
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const body = raw.replace(/^---[\s\S]*?---\n?/, '')
    return formatReadingTime(countWords(body))
  } catch {
    return '5 min read'
  }
}

export async function readingTimeForBlogSlug(slug: string): Promise<string> {
  'use cache'
  cacheLife('max')
  cacheTag('site-content', 'blog', slug)

  return readingTimeForBlogSlugSync(slug)
}

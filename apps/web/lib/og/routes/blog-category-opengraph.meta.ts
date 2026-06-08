import { BLOG_CATEGORIES } from '@/lib/blog'
import { ogImageContentType, ogImageSize } from '@/lib/og/constants'

export const alt = 'Arche blog category'
export const size = ogImageSize
export const contentType = ogImageContentType

export function generateStaticParams() {
  const params: { category: string }[] = []

  for (const cat of BLOG_CATEGORIES) {
    if (cat.id !== 'all') {
      params.push({ category: cat.id })
    }
  }

  return params
}

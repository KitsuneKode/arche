import { getBlogFrontmatter } from '@/lib/blog'
import { blogSource } from '@/lib/blog-source'
import { ogImageContentType, ogImageSize } from '@/lib/og/constants'

export const alt = 'Arche blog post'
export const size = ogImageSize
export const contentType = ogImageContentType

export function generateStaticParams() {
  const params: { slug: string }[] = []

  for (const page of blogSource.getPages()) {
    const slug = page.slugs[0]
    if (slug && !getBlogFrontmatter(page).draft) {
      params.push({ slug })
    }
  }

  return params
}

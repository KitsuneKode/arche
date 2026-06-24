import { notFound } from 'next/navigation'

import { Navbar } from '@/components/arche/navbar'
import { SiteFrame, SiteShell } from '@/components/arche/site-primitives'
import { ArticleShell } from '@/components/blog/article-shell'
import { BlogPostArticleFooter } from '@/components/blog/blog-post-chrome'
import { BlogPostJsonLd } from '@/components/blog/blog-post-json-ld'
import { buildBlogPostMetadata, getBlogCategory, getBlogFrontmatter } from '@/lib/blog'
import { readingTimeForBlogSlugSync } from '@/lib/blog-reading-time'
import { blogSource } from '@/lib/blog-source'
import { getMdxComponents } from '@/lib/get-mdx-components'

type Props = {
  params: Promise<{ slug: string }>
}

const blogPostFooter = <BlogPostArticleFooter />

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const page = blogSource.getPage([slug])
  if (!page) return { title: 'Post not found' }
  return buildBlogPostMetadata(page)
}

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const page = blogSource.getPage([slug])
  if (!page || getBlogFrontmatter(page).draft) notFound()

  const data = getBlogFrontmatter(page)
  const MDX = page.data.body
  const category = getBlogCategory(page)
  const readingTime = readingTimeForBlogSlugSync(slug)

  return (
    <SiteShell className="overflow-x-hidden">
      <BlogPostJsonLd page={page} />
      <Navbar />
      <SiteFrame>
        <ArticleShell
          blogMeta={{
            date: data.date,
            category,
            readingTime,
            tags: data.tags,
          }}
          title={data.title}
          description={data.description}
          footer={blogPostFooter}
        >
          <MDX components={getMdxComponents()} />
        </ArticleShell>
      </SiteFrame>
    </SiteShell>
  )
}

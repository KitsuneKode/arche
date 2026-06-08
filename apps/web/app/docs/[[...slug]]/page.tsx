import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocsPageBody, DocsPageHeader } from '@/components/docs/docs-page-header'
import type { TocItem } from '@/components/docs/docs-toc'
import { DocsPageJsonLd } from '@/components/seo/docs-page-json-ld'
import { getCachedDocsMetadata } from '@/lib/content-cache'
import { getMdxComponents } from '@/lib/get-mdx-components'
import { DocsProse } from '@/lib/mdx-components'
import { readingTimeFromText } from '@/lib/reading-time'
import { source } from '@/lib/source'

type Props = {
  params: Promise<{ slug?: string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params
  return getCachedDocsMetadata(slug)
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: page.slugs,
  }))
}

export default async function DocsMdxPage({ params }: Props) {
  const { slug = [] } = await params
  const page = source.getPage(slug)
  if (!page) notFound()

  const MDX = page.data.body
  const readingTime = readingTimeFromText(page.data.title, page.data.description)
  const tocItems: TocItem[] | undefined = page.data.toc
    ?.map((entry) => {
      const title = typeof entry.title === 'string' ? entry.title : String(entry.title ?? '')
      if (!title) return null

      return {
        id: entry.url.slice(1),
        title,
        depth: entry.depth === 3 ? 3 : 2,
      } satisfies TocItem
    })
    .filter((item): item is TocItem => item !== null)

  return (
    <div className="flex h-full flex-col">
      <DocsPageJsonLd
        title={page.data.title}
        description={page.data.description}
        path={page.url}
        slug={slug}
      />
      <DocsPageHeader
        title={page.data.title}
        description={page.data.description}
        readingTime={readingTime}
      />
      <DocsPageBody tocItems={tocItems}>
        <DocsProse>
          <MDX components={getMdxComponents()} />
        </DocsProse>
      </DocsPageBody>
    </div>
  )
}

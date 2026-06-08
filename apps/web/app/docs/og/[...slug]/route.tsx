import { ImageResponse } from 'next/og'

import { getCachedDocsOgFields } from '@/lib/content-cache'
import { ogImageSize } from '@/lib/og/constants'
import { OgShell } from '@/lib/og/shell'
import { source } from '@/lib/source'

type Props = {
  params: Promise<{ slug: string[] }>
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: page.slugs,
  }))
}

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params
  const { title, description } = await getCachedDocsOgFields(slug)

  return new ImageResponse(
    <OgShell
      eyebrow="Arche docs"
      title={title}
      subtitle={description}
      footer="kitsunekode · arche"
    />,
    {
      ...ogImageSize,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  )
}

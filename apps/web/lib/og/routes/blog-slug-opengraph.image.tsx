import { ImageResponse } from 'next/og'

import { getCachedBlogOgFields } from '@/lib/content-cache'
import { OgShell } from '@/lib/og/shell'

import { size } from './blog-slug-opengraph.meta'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function Image({ params }: Props) {
  const { slug } = await params
  const { title, description, category } = await getCachedBlogOgFields(slug)

  return new ImageResponse(
    <OgShell
      eyebrow={`Arche blog · ${category}`}
      title={title}
      subtitle={description}
      footer="kitsunekode · arche"
    />,
    size,
  )
}

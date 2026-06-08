import { ImageResponse } from 'next/og'

import { ogImageSize } from '@/lib/og/constants'
import { OgShell } from '@/lib/og/shell'

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')?.slice(0, 120) ?? 'Arche blog'

  return new ImageResponse(
    <OgShell eyebrow="Arche blog" title={title} footer="kitsunekode · arche" />,
    ogImageSize,
  )
}

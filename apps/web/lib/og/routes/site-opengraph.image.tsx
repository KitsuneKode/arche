import { ImageResponse } from 'next/og'

import { OgShell } from '@/lib/og/shell'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo'

import { size } from './site-opengraph.meta'

export default function Image() {
  return new ImageResponse(
    <OgShell
      eyebrow={SITE_NAME}
      title="Project origin system."
      subtitle={SITE_DESCRIPTION}
      footer="kitsunekode · arche"
      markSize={162}
    />,
    size,
  )
}

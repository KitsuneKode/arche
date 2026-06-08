import { ImageResponse } from 'next/og'

import { OgShell } from '@/lib/og/shell'

import { size } from './blog-index-opengraph.meta'

export default function Image() {
  return new ImageResponse(
    <OgShell
      eyebrow="Arche blog"
      title="Changelog, guides, and technical notes."
      subtitle="Release notes, preset walkthroughs, and implementation notes from the Arche monorepo."
      footer="kitsunekode · arche"
    />,
    size,
  )
}

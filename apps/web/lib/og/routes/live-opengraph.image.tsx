import { ImageResponse } from 'next/og'

import { OgShell } from '@/lib/og/shell'

import { size } from './live-opengraph.meta'

export default function Image() {
  return new ImageResponse(
    <OgShell
      eyebrow="Live sandbox"
      title="Chat, posts, and proof run."
      subtitle="Real tRPC, Prisma, and Better Auth against the arche.dev demo API."
      footer="kitsunekode · arche"
    />,
    size,
  )
}

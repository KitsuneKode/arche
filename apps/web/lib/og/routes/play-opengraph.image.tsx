import { ImageResponse } from 'next/og'

import { OgShell } from '@/lib/og/shell'

import { size } from './play-opengraph.meta'

export default function Image() {
  return new ImageResponse(
    <OgShell
      eyebrow="Relay"
      title="Live chat + stack ping."
      subtitle="tRPC, SSE/poll, and real API latency on the arche.dev demo stack."
      footer="kitsunekode · arche"
    />,
    size,
  )
}

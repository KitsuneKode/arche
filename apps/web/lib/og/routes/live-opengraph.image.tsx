import { ImageResponse } from 'next/og'

import { OgShell } from '@/lib/og/shell'

import { size } from './live-opengraph.meta'

export default function Image() {
  return new ImageResponse(
    <OgShell
      eyebrow="Live sandbox"
      title="Relay Run, chat, and proof run."
      subtitle="Flappy-style mini-game, leaderboard, tRPC, Prisma, and Better Auth on arche.dev."
      footer="kitsunekode · arche"
    />,
    size,
  )
}

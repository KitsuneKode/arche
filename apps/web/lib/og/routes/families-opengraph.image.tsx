import { ImageResponse } from 'next/og'

import { OgShell } from '@/lib/og/shell'

import { size } from './families-opengraph.meta'

export default function Image() {
  return new ImageResponse(
    <OgShell
      eyebrow="Arche presets"
      title="Choose a route, not a vibe."
      subtitle="Compare TypeScript, Convex, Rust, and Solana presets with verification evidence before scaffolding."
      footer="kitsunekode · arche"
    />,
    size,
  )
}

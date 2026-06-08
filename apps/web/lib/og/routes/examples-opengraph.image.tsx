import { ImageResponse } from 'next/og'

import { OgShell } from '@/lib/og/shell'

import { size } from './examples-opengraph.meta'

export default function Image() {
  return new ImageResponse(
    <OgShell
      eyebrow="Arche examples"
      title="Code the CLI actually writes."
      subtitle="Illustrative snippets for TypeScript, Convex, Rust, Solana, and CLI automation."
      footer="kitsunekode · arche"
    />,
    size,
  )
}

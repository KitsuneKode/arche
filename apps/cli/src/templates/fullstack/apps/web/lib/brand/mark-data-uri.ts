import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let cachedMarkDataUri: string | undefined

/** Inline arche-mark.svg for Next.js ImageResponse (Satori). */
export function getArcheMarkDataUri(): string {
  if (cachedMarkDataUri) {
    return cachedMarkDataUri
  }

  const svgPath = join(process.cwd(), 'public/brand/arche-mark.svg')
  const svg = readFileSync(svgPath, 'utf8')
  cachedMarkDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  return cachedMarkDataUri
}

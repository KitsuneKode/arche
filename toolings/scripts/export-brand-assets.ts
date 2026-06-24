#!/usr/bin/env bun
/**
 * Export README / GitHub / npm brand assets from canonical SVGs.
 * Also refreshes apps/web/public/brand/og-image.png via the dynamic OG route.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const ROOT = join(import.meta.dir, '../..')
const BRAND_DIR = join(ROOT, 'apps/web/public/brand')
const DOCS_ASSETS = join(ROOT, 'docs/assets')

const exports: Array<{ input: string; output: string; width: number; height?: number }> = [
  {
    input: join(BRAND_DIR, 'arche-logo.svg'),
    output: join(DOCS_ASSETS, 'readme-banner.png'),
    width: 1200,
    height: 280,
  },
  {
    input: join(BRAND_DIR, 'arche-mark.svg'),
    output: join(DOCS_ASSETS, 'arche-mark-512.png'),
    width: 512,
    height: 512,
  },
]

async function rasterizeSvg(
  svgPath: string,
  outputPath: string,
  width: number,
  height?: number,
): Promise<void> {
  const svg = readFileSync(svgPath)
  const background = { r: 9, g: 9, b: 11, alpha: 1 } as const
  const pipeline = height
    ? sharp(svg, { density: 300 }).resize(width, height, { fit: 'contain', background })
    : sharp(svg, { density: 300 }).resize({ width })
  await pipeline.png().toFile(outputPath)
  console.log(`Wrote ${outputPath}`)
}

async function exportStaticAssets(): Promise<void> {
  mkdirSync(DOCS_ASSETS, { recursive: true })
  for (const item of exports) {
    await rasterizeSvg(item.input, item.output, item.width, item.height)
  }
}

async function exportOgAndSocial(): Promise<void> {
  const ogScript = join(import.meta.dir, 'export-og-image.ts')
  await Bun.$`bun ${ogScript}`.cwd(ROOT)

  const ogPath = join(BRAND_DIR, 'og-image.png')
  const socialPath = join(DOCS_ASSETS, 'social-preview.png')
  await sharp(ogPath).resize(1280, 640, { fit: 'cover' }).png().toFile(socialPath)
  console.log(`Wrote ${socialPath}`)
}

async function exportCliIcon(): Promise<void> {
  const cliAssets = join(ROOT, 'apps/cli/assets')
  mkdirSync(cliAssets, { recursive: true })
  const mark = readFileSync(join(BRAND_DIR, 'arche-mark.svg'))
  await sharp(mark, { density: 300 })
    .resize(256, 256, { fit: 'contain', background: { r: 9, g: 9, b: 11, alpha: 1 } })
    .png()
    .toFile(join(cliAssets, 'icon.png'))
  console.log(`Wrote ${join(cliAssets, 'icon.png')}`)
}

async function exportWebIcons(): Promise<void> {
  const webPublic = join(ROOT, 'apps/web/public')
  const faviconSvg = join(webPublic, 'favicon.svg')
  const svg = readFileSync(faviconSvg)
  const background = { r: 9, g: 9, b: 11, alpha: 1 } as const
  await sharp(svg, { density: 300 })
    .resize(32, 32, { fit: 'contain', background })
    .png()
    .toFile(join(webPublic, 'favicon.ico'))
  await sharp(svg, { density: 300 })
    .resize(180, 180, { fit: 'contain', background })
    .png()
    .toFile(join(webPublic, 'apple-touch-icon.png'))
  console.log('Wrote apps/web/public/favicon.ico and apple-touch-icon.png')
}

async function main(): Promise<void> {
  await exportStaticAssets()
  await exportOgAndSocial()
  await exportCliIcon()
  await exportWebIcons()
}

if (import.meta.main) {
  await main()
}

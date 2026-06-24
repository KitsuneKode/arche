import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { TocItem } from '@/components/docs/docs-toc'

const WEB_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Flatten fumadocs / MDX TOC titles into plain strings safe for client props. */
export function extractTocTitle(title: unknown): string {
  if (typeof title === 'string') return title
  if (typeof title === 'number') return String(title)
  if (Array.isArray(title)) {
    return title.map(extractTocTitle).join('')
  }
  if (title && typeof title === 'object' && 'props' in title) {
    const props = (title as { props?: { children?: unknown } }).props
    if (props?.children !== undefined) {
      return extractTocTitle(props.children)
    }
  }
  return ''
}

export function slugifyHeadingText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
}

function plainMdxHeadingTitle(raw: string): string {
  return raw
    .replace(/<[^/>][^>]*\/>/g, '')
    .replace(/<[^>]+>([^<]*)<\/[^>]+>/g, '$1')
    .replace(/\{[^}]*\}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

/** Build SSR-safe TOC entries from an on-disk MDX file (matches `createHeading` ids). */
export function buildDocTocFromMdx(relativePath: string): TocItem[] {
  const filePath = path.join(WEB_ROOT, relativePath)
  if (!fs.existsSync(filePath)) return []

  const items: TocItem[] = []
  let inFence = false

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (!match?.[1] || !match[2]) continue

    const depth = match[1].length === 2 ? 2 : 3
    const title = plainMdxHeadingTitle(match[2])
    const id = slugifyHeadingText(title)
    if (!id || !title) continue

    items.push({ id, title, depth })
  }

  return items
}

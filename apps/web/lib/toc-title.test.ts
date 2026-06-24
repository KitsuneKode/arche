import { describe, expect, it } from 'bun:test'

import { buildDocTocFromMdx, extractTocTitle, slugifyHeadingText } from '@/lib/toc-title'

describe('toc-title', () => {
  it('extracts nested react-like title nodes', () => {
    const title = extractTocTitle({
      props: { children: ['Quick ', { props: { children: 'loop' } }] },
    })
    expect(title).toBe('Quick loop')
  })

  it('slugifies heading text', () => {
    expect(slugifyHeadingText('CLI from source (today)')).toBe('cli-from-source-today')
  })

  it('builds TOC from getting-started MDX', () => {
    const items = buildDocTocFromMdx('content/docs/getting-started.mdx')
    expect(items.length).toBeGreaterThan(2)
    expect(items.some((item) => item.id === 'quick-loop' && item.title === 'Quick loop')).toBe(true)
  })
})

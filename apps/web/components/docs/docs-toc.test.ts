import { describe, expect, it } from 'bun:test'

import type { TocItem } from '@/components/docs/docs-toc'
import { resetStableTocItemsCache, stableTocItems } from '@/lib/toc-snapshot'

const sample: TocItem[] = [
  { id: 'quick-loop', title: 'Quick loop', depth: 2 },
  { id: 'preset-catalog', title: 'Preset catalog', depth: 2 },
]

describe('stableTocItems', () => {
  it('returns the same array reference when content is unchanged', () => {
    resetStableTocItemsCache()
    const first = stableTocItems(sample)
    const second = stableTocItems([...sample])
    expect(first).toBe(second)
  })

  it('returns a new reference when content changes', () => {
    resetStableTocItemsCache()
    const first = stableTocItems(sample)
    const second = stableTocItems([...sample, { id: 'next', title: 'Next', depth: 2 }])
    expect(first).not.toBe(second)
  })
})

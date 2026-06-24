import type { TocItem } from '@/components/docs/docs-toc'

function tocItemsKey(items: TocItem[]): string {
  return items.map((item) => `${item.depth}:${item.id}:${item.title}`).join('|')
}

const stableByKey = new Map<string, TocItem[]>()

/** Return a referentially stable array when heading content is unchanged (for useSyncExternalStore). */
export function stableTocItems(next: TocItem[]): TocItem[] {
  const key = tocItemsKey(next)
  const cached = stableByKey.get(key)
  if (cached) return cached
  stableByKey.set(key, next)
  return next
}

export function resetStableTocItemsCache() {
  stableByKey.clear()
}

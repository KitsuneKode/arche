'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { cn } from '@arche-template/ui/lib/utils'
import { stableTocItems } from '@/lib/toc-snapshot'

export type TocItem = {
  id: string
  title: string
  depth: 2 | 3
}

function collectHeadings(container: HTMLElement): TocItem[] {
  return Array.from(container.querySelectorAll('h2, h3')).map((el) => ({
    id: el.id,
    title: el.textContent?.trim() ?? '',
    depth: el.tagName === 'H3' ? 3 : 2,
  }))
}

function subscribeToProseHeadings(proseSelector: string, onStoreChange: () => void) {
  if (typeof document === 'undefined') return () => {}

  const prose = document.querySelector<HTMLElement>(proseSelector)
  if (!prose) return () => {}

  let rafId = 0
  const scheduleChange = () => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      onStoreChange()
    })
  }

  const observer = new MutationObserver(scheduleChange)
  observer.observe(prose, { childList: true, subtree: true, characterData: true })

  return () => {
    if (rafId) cancelAnimationFrame(rafId)
    observer.disconnect()
  }
}

function getProseHeadingsSnapshot(proseSelector: string): TocItem[] {
  if (typeof document === 'undefined') return []

  const prose = document.querySelector<HTMLElement>(proseSelector)
  if (!prose) return []

  const items = collectHeadings(prose).filter((item) => item.id && item.title)
  return stableTocItems(items)
}

function getServerProseHeadingsSnapshot(): TocItem[] {
  return []
}

function filterSafeTocItems(items?: TocItem[]): TocItem[] | undefined {
  const filtered = items?.filter((item) => item.title && item.title !== '[object Object]')
  return filtered && filtered.length >= 2 ? filtered : undefined
}

function DocsTocRailInner({ items, className }: { items: TocItem[]; className?: string }) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (typeof document === 'undefined') return

    let currentActiveId = ''

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const nextId = visible[0]?.target.id ?? ''
        if (nextId !== currentActiveId) {
          currentActiveId = nextId
          setActiveId(nextId)
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    )

    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [items])

  return (
    <nav
      aria-label="On this page"
      className={cn(
        'sticky top-24 hidden h-[calc(100vh-8rem)] w-52 shrink-0 overflow-y-auto xl:block',
        className,
      )}
    >
      <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
        On this page
      </p>
      <ul className="space-y-1 border-l border-zinc-800">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block border-l py-1.5 pl-3 text-sm leading-snug transition-colors',
                item.depth === 3 && 'pl-6 text-xs',
                activeId === item.id
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300',
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function DocsTocRailFromProps({ items, className }: { items: TocItem[]; className?: string }) {
  return <DocsTocRailInner items={items} className={className} />
}

function DocsTocRailFromDom({
  className,
  proseSelector,
}: {
  className?: string
  proseSelector: string
}) {
  const domItems = useSyncExternalStore(
    (onStoreChange) => subscribeToProseHeadings(proseSelector, onStoreChange),
    () => getProseHeadingsSnapshot(proseSelector),
    getServerProseHeadingsSnapshot,
  )

  if (domItems.length < 2) return null

  return <DocsTocRailInner items={domItems} className={className} />
}

export function DocsTocRail({
  className,
  items: itemsProp,
  proseSelector = '.docs-prose',
}: {
  className?: string
  items?: TocItem[]
  proseSelector?: string
}) {
  const safePropItems = filterSafeTocItems(itemsProp)

  if (safePropItems) {
    return <DocsTocRailFromProps items={safePropItems} className={className} />
  }

  return <DocsTocRailFromDom className={className} proseSelector={proseSelector} />
}

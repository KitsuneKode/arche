'use client'

import { useSyncExternalStore } from 'react'

import { cn } from '@arche-template/ui/lib/utils'

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

  const observer = new MutationObserver(onStoreChange)
  observer.observe(prose, { childList: true, subtree: true, characterData: true })

  return () => observer.disconnect()
}

function getProseHeadingsSnapshot(proseSelector: string): TocItem[] {
  if (typeof document === 'undefined') return []

  const prose = document.querySelector<HTMLElement>(proseSelector)
  if (!prose) return []

  return collectHeadings(prose).filter((item) => item.id && item.title)
}

function getServerProseHeadingsSnapshot(): TocItem[] {
  return []
}

function DocsTocRailInner({ items, className }: { items: TocItem[]; className?: string }) {
  const activeId = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof document === 'undefined') return () => {}

      let currentActiveId = ''

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          const nextId = visible[0]?.target.id ?? ''
          if (nextId !== currentActiveId) {
            currentActiveId = nextId
            onStoreChange()
          }
        },
        { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
      )

      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el) observer.observe(el)
      }

      return () => observer.disconnect()
    },
    () => {
      if (typeof document === 'undefined') return ''

      let activeElement: HTMLElement | null = null
      let activeTop = Number.POSITIVE_INFINITY

      for (const item of items) {
        const el = document.getElementById(item.id)
        if (!el) continue

        const rect = el.getBoundingClientRect()
        if (rect.top >= 0 && rect.bottom > 80 && rect.top < activeTop) {
          activeElement = el
          activeTop = rect.top
        }
      }

      return activeElement?.id ?? ''
    },
    () => '',
  )

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

export function DocsTocRail({
  className,
  items: itemsProp,
  proseSelector = '.docs-prose',
}: {
  className?: string
  items?: TocItem[]
  proseSelector?: string
}) {
  const domItems = useSyncExternalStore(
    (onStoreChange) => subscribeToProseHeadings(proseSelector, onStoreChange),
    () => getProseHeadingsSnapshot(proseSelector),
    getServerProseHeadingsSnapshot,
  )
  const items = itemsProp ?? domItems

  if (items.length < 2) return null

  return (
    <DocsTocRailInner
      key={items.map((item) => item.id).join('|')}
      items={items}
      className={className}
    />
  )
}

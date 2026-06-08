import Link from 'next/link'
import type { ReactNode } from 'react'

import { DocsTocRail, type TocItem } from '@/components/docs/docs-toc'

export function DocsPageHeader({
  title,
  description,
  readingTime,
}: {
  title: string
  description?: string
  readingTime?: string
}) {
  return (
    <header className="border-b border-zinc-800 bg-black px-6 py-10 md:px-12 md:py-14">
      <Link
        href="/docs"
        className="mb-6 inline-flex font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase transition-colors hover:text-white"
      >
        ← Documentation
      </Link>
      <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.08] font-bold tracking-tight text-balance text-white">
        {title}
      </h1>
      {description || readingTime ? (
        <div className="mt-4 max-w-2xl space-y-2">
          {description ? (
            <p className="text-base leading-relaxed font-medium text-pretty text-zinc-400 md:text-lg">
              {description}
            </p>
          ) : null}
          {readingTime ? (
            <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase tabular-nums">
              {readingTime}
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}

export function DocsPageBody({
  children,
  showToc = true,
  tocItems,
}: {
  children: ReactNode
  showToc?: boolean
  tocItems?: TocItem[]
}) {
  return (
    <div className="flex-1 px-6 py-10 md:px-12 md:py-14">
      <div className="mx-auto flex max-w-6xl gap-10 xl:gap-14">
        <div className="max-w-3xl min-w-0 flex-1">{children}</div>
        {showToc ? <DocsTocRail items={tocItems} /> : null}
      </div>
    </div>
  )
}

import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@arche-template/ui/lib/utils'
import { GridBackdrop } from '@/components/arche/site-primitives'
import { BlogPostMeta } from '@/components/blog/blog-post-chrome'
import { DocsTocRail } from '@/components/docs/docs-toc'
import { DocsProse } from '@/lib/mdx-components'

export type ArticleBlogMeta = {
  date?: string
  category: string
  readingTime: string
  tags?: string[]
}

export function ArticleShell({
  meta,
  blogMeta,
  title,
  description,
  children,
  footer,
}: {
  meta?: ReactNode
  blogMeta?: ArticleBlogMeta
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const metaContent = blogMeta ? <BlogPostMeta {...blogMeta} /> : meta
  return (
    <>
      <header className="relative overflow-hidden border-b border-zinc-800 bg-black px-6 py-12 md:px-12 md:py-16">
        <GridBackdrop />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-8 inline-flex font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase transition-colors hover:text-white"
          >
            ← All posts
          </Link>
          <div className="mb-6 flex flex-wrap items-center gap-3">{metaContent}</div>
          <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] font-bold tracking-tight text-balance text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 text-lg leading-relaxed font-medium text-pretty text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-12 md:gap-14 md:px-12 md:py-16">
        <div className="max-w-3xl min-w-0 flex-1">
          <DocsProse>{children}</DocsProse>
          {footer ? (
            <footer className={cn('mt-20 border-t border-zinc-800 pt-10')}>{footer}</footer>
          ) : null}
        </div>
        <DocsTocRail />
      </div>
    </>
  )
}

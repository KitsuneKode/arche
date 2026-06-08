import Link from 'next/link'

import { formatBlogDate } from '@/lib/blog'

export function BlogPostArticleFooter() {
  return (
    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <div>
        <p className="text-sm font-semibold text-white">KitsuneKode</p>
        <p className="font-mono text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
          Maintains Arche
        </p>
      </div>
      <Link
        href="/blog"
        className="inline-flex min-h-10 items-center border border-zinc-700 px-5 py-2 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:border-white"
      >
        All posts
      </Link>
    </div>
  )
}

export function BlogPostMeta({
  date,
  category,
  readingTime,
  tags,
}: {
  date?: string
  category: string
  readingTime: string
  tags?: string[]
}) {
  return (
    <>
      {date ? (
        <time
          dateTime={date}
          className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase tabular-nums"
        >
          {formatBlogDate(date)}
        </time>
      ) : null}
      <span className="size-1 rounded-full bg-zinc-700" aria-hidden />
      <span className="font-mono text-[10px] tracking-[0.2em] text-amber-500/90 uppercase">
        {category}
      </span>
      <span className="size-1 rounded-full bg-zinc-700" aria-hidden />
      <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase tabular-nums">
        {readingTime}
      </span>
      {tags?.map((tag) => (
        <span
          key={tag}
          className="border border-zinc-800 px-2 py-0.5 font-mono text-[10px] tracking-widest text-zinc-500 uppercase"
        >
          {tag}
        </span>
      ))}
    </>
  )
}

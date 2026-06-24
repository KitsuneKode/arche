'use client'

import { useEffect } from 'react'

export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Docs route error:', error.digest ?? error.message)
  }, [error])

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center bg-black px-6 py-16 text-center text-white">
      <div className="mb-6 flex size-12 items-center justify-center rounded-full border border-zinc-700">
        <span className="text-lg text-amber-400" aria-hidden>
          △
        </span>
      </div>
      <h1 className="text-xl font-bold tracking-tight">This page couldn&apos;t load</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        Reload to try again, or go back to the docs index.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Reload
        </button>
        <a
          href="/docs/getting-started"
          className="border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-zinc-500"
        >
          Back
        </a>
      </div>
    </main>
  )
}

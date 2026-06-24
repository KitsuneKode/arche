'use client'

import { useEffect } from 'react'

export default function PlayError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Play route error:', error.digest ?? error.message)
  }, [error])

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center bg-black px-6 py-16 text-center text-white">
      <div className="mb-6 flex size-12 items-center justify-center rounded-full border border-zinc-700">
        <span className="text-lg text-amber-400" aria-hidden>
          △
        </span>
      </div>
      <h1 className="text-xl font-bold tracking-tight">Relay couldn&apos;t load</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-400">Reload to try again.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="border border-white bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Reload
        </button>
        <a
          href="/live"
          className="border border-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-zinc-500"
        >
          Full live demo
        </a>
      </div>
    </main>
  )
}

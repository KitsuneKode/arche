'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Something went wrong</p>
        <h1>Application error</h1>
        <p className="lede">{error.message}</p>
        <div className="actions">
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </section>
    </main>
  )
}

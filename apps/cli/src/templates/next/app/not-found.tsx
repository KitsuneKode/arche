import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="lede">The route you requested does not exist in this app yet.</p>
        <div className="actions">
          <Link href="/">Back home</Link>
        </div>
      </section>
    </main>
  )
}

import { ApiStatus } from './api-status'

const services = [
  ['apps/web', 'Next.js', 'User-facing app and local service dashboard'],
  ['apps/api', 'Express', 'HTTP API boundary for product requests'],
  ['apps/worker', 'Bun', 'Background jobs and async workflows'],
  ['services/*', 'Rust / Go / Python', 'Add owned services when a runtime earns its place'],
] as const

export default function Page() {
  return (
    <main className="page">
      <section className="intro">
        <p className="eyebrow">Polyglot scaffold</p>
        <h1>One product, explicit service boundaries.</h1>
        <p className="lede">
          Start with a TypeScript web/API/worker spine. Add Rust, Go, or Python services under
          <code>services/*</code> when their runtime gives you a real advantage.
        </p>
      </section>

      <ApiStatus />

      <section className="services" aria-label="Workspace services">
        {services.map(([path, runtime, detail]) => (
          <article key={path}>
            <span>{path}</span>
            <h2>{runtime}</h2>
            <p>{detail}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

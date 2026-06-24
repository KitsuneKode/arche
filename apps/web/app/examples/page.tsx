import Link from 'next/link'
import { Suspense } from 'react'

import { CodeExample } from '@/components/arche/code-example'
import { Navbar } from '@/components/arche/navbar'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Code examples',
  description:
    'Generated wiring snippets for TypeScript, Convex, Rust, Solana, and CLI automation.',
  path: '/examples',
})

export default function ExamplesPage() {
  return (
    <main className="min-h-screen bg-black font-sans text-white selection:bg-white selection:text-black">
      <Navbar />

      <div className="mx-auto flex min-h-[calc(100vh-56px)] max-w-[1200px] flex-col border-r border-l border-zinc-800">
        <section className="relative overflow-hidden border-b border-zinc-800 bg-black p-6 md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-zinc-800 bg-black px-3 py-1 font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              Generated patterns
            </div>

            <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-white md:text-5xl">
              Code the CLI actually writes
            </h1>

            <p className="mt-6 text-lg leading-relaxed font-medium text-pretty text-zinc-400">
              Illustrative snippets aligned with Arche presets—not a live sandbox. For live API
              calls, use{' '}
              <Link href="/live" className="text-white underline underline-offset-4">
                /live
              </Link>
              . For full flows, start with{' '}
              <Link
                href="/docs/getting-started"
                className="text-white underline underline-offset-4"
              >
                getting started
              </Link>{' '}
              or a{' '}
              <Link
                href="/docs/guides/walkthrough-typescript-fullstack"
                className="text-white underline underline-offset-4"
              >
                walkthrough
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="flex-1 bg-black p-6 md:p-16">
          <Suspense
            fallback={
              <div className="border border-zinc-800 bg-black p-8 font-mono text-sm text-zinc-500">
                Loading highlighted examples...
              </div>
            }
          >
            <CodeExample />
          </Suspense>
        </section>
      </div>
    </main>
  )
}

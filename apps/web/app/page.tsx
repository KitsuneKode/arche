import { Metadata } from 'next'

import { AnimatedTerminal } from '@/components/arche/animated-terminal'
import { ArchitectureGraph } from '@/components/arche/architecture-graph'
import { FeatureGrid } from '@/components/arche/feature-grid'
import { Navbar } from '@/components/arche/navbar'
import {
  PrimaryLink,
  SiteFrame,
  SiteShell,
  StatusPill,
  GridBackdrop,
} from '@/components/arche/site-primitives'
import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  title: 'Scaffold the boring parts',
  description:
    'A personal vault for serious starts—TypeScript fullstack, Convex + Next.js, Rust, and Solana—with deployment notes and agent context that still makes sense after the first commit.',
  path: '/',
  ogImagePath: '/opengraph-image',
})

export default function LandingPage() {
  return (
    <SiteShell>
      <Navbar />

      <SiteFrame>
        <section className="relative overflow-hidden border-b border-zinc-800 bg-black p-6 md:p-16">
          <GridBackdrop />
          <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 translate-x-1/2 -translate-y-1/2 bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="flex flex-col items-start">
              <div className="mb-8 flex flex-wrap gap-3">
                <StatusPill tone="watch" pulse>
                  CLI release guarded
                </StatusPill>
                <StatusPill tone="muted">Bun first, pnpm supported</StatusPill>
              </div>

              <h1 className="mb-8 max-w-6xl text-[clamp(2.75rem,5vw,5.5rem)] leading-[0.92] font-black tracking-tighter text-balance uppercase">
                <span className="mb-3 inline-block bg-white px-4 py-2 text-black shadow-[8px_8px_0_0_rgba(255,255,255,0.1)]">
                  Arche
                </span>
                <span className="block text-white">Scaffold the boring parts.</span>
              </h1>

              <p className="mb-10 max-w-3xl text-xl leading-snug font-medium text-pretty text-zinc-400 md:text-2xl">
                A personal vault for serious starts—TypeScript fullstack, Convex + Next.js, Rust,
                and Solana—with deployment notes and agent context that still makes sense after the
                first commit.
              </p>

              <div className="flex flex-wrap gap-3">
                <PrimaryLink href="/docs/getting-started">Read the docs</PrimaryLink>
                <PrimaryLink href="/live" variant="outline">
                  See it live
                </PrimaryLink>
                <PrimaryLink href="/families" variant="outline">
                  Compare presets
                </PrimaryLink>
              </div>
            </div>
            <AnimatedTerminal />
          </div>
        </section>

        <section className="border-b border-zinc-800 bg-zinc-950 px-6 py-16 md:px-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 font-mono text-[10px] tracking-widest text-amber-400 uppercase">
                Demo API on arche.dev
              </p>
              <h2 className="mb-4 text-3xl leading-tight font-bold tracking-tight text-balance text-white md:text-4xl">
                Try the live stack
              </h2>
              <ul className="space-y-2 text-lg leading-relaxed font-medium text-pretty text-zinc-400">
                <li>Real tRPC + Prisma + Better Auth against a running API</li>
                <li>Public chat feed; sign in to post and create draft notes</li>
                <li>Proof run verifies health, contracts, and auth in one view</li>
              </ul>
            </div>
            <PrimaryLink href="/live">Open live demo</PrimaryLink>
          </div>
        </section>

        <FeatureGrid />

        <ArchitectureGraph />

        <section className="border-t border-zinc-800 bg-black px-6 py-16 md:px-16 md:py-24">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="mb-4 text-2xl leading-tight font-bold tracking-tight text-balance text-white md:text-3xl">
                Verify the preset, then commit
              </h2>
              <p className="text-lg leading-relaxed font-medium text-pretty text-zinc-400">
                Generate a workspace, read the verification labels, and follow the docs that match
                your route. Changelog and longer notes live on the blog.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryLink href="/docs/guides/first-hour">First hour</PrimaryLink>
              <PrimaryLink href="/blog" variant="outline">
                Read the blog
              </PrimaryLink>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 p-4 font-mono text-xs font-bold tracking-widest text-zinc-400 uppercase">
          <div>Next.js 16</div>
          <div>TypeScript</div>
          <div className="hidden sm:block">tRPC</div>
          <div className="hidden md:block">Convex</div>
          <div className="hidden md:block">Rust</div>
          <div className="hidden md:block">Solana</div>
        </div>
      </SiteFrame>
    </SiteShell>
  )
}

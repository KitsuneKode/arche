'use client'

import { m } from 'motion/react'
import { useState } from 'react'

import { CodePanel, SectionHeading } from '@/components/arche/site-primitives'

type RouteId = 'fullstack' | 'convex' | 'rust'

const routes: Record<
  RouteId,
  {
    label: string
    summary: string
    nodes: { id: string; path: string; title: string; body: string; code: string }[]
  }
> = {
  fullstack: {
    label: 'TypeScript fullstack',
    summary:
      'Default monorepo: Next.js web, Express API, tRPC contract package, Prisma store, optional worker.',
    nodes: [
      {
        id: '01',
        path: 'apps/web',
        title: 'Next.js 16 UI',
        body: 'App Router, tRPC client + server caller, Better Auth session boundary.',
        code: 'const user = await trpcCaller.user.me()',
      },
      {
        id: '02',
        path: 'apps/server',
        title: 'Module-first API',
        body: 'Express hosts Better Auth and tRPC; features live under modules/*.trpc.ts.',
        code: 'router.use("/api/trpc", trpcHandler)',
      },
      {
        id: '03',
        path: 'packages/trpc',
        title: 'Client contract',
        body: 'Re-exports AppRouter from the server—no duplicated router definitions.',
        code: 'export type { AppRouter } from "@scope/server"',
      },
      {
        id: '04',
        path: 'packages/store',
        title: 'Prisma data layer',
        body: 'Schema, migrations, and generated client shared by the API.',
        code: 'prisma.user.findMany()',
      },
    ],
  },
  convex: {
    label: 'Convex product',
    summary:
      'Single-app route: Next.js UI talks to Convex functions—no Express, Prisma, or tRPC monorepo.',
    nodes: [
      {
        id: '01',
        path: 'app/',
        title: 'Next.js UI',
        body: 'ConvexProvider wraps the App Router; useQuery from convex/react after convex dev.',
        code: 'useQuery(api.posts.listPublished)',
      },
      {
        id: '02',
        path: 'convex/',
        title: 'Functions + schema',
        body: 'Queries, mutations, and indexes live in convex/*.ts with Convex storage.',
        code: 'export const list = query({ ... })',
      },
      {
        id: '03',
        path: 'convex/auth',
        title: 'Auth stubs',
        body: 'Better Auth sync helpers—complete wiring per docs/convex-integration.md.',
        code: 'export const syncUser = mutation({ ... })',
      },
      {
        id: '04',
        path: 'deploy',
        title: 'Vercel + Convex Cloud',
        body: 'NEXT_PUBLIC_CONVEX_URL on web; convex deploy for backend.',
        code: 'bunx convex deploy',
      },
    ],
  },
  rust: {
    label: 'Rust API / fullstack',
    summary: 'Cargo workspace with Axum modules, optional Next.js web for rust-fullstack.',
    nodes: [
      {
        id: '01',
        path: 'services/api',
        title: 'Axum API',
        body: 'Module-first handlers, services, repositories, SQLx-ready persistence.',
        code: 'Router::new().merge(health::routes())',
      },
      {
        id: '02',
        path: 'Cargo.toml',
        title: 'Workspace',
        body: 'Shared workspace deps, release profile, and quality gates.',
        code: 'cargo test --workspace',
      },
      {
        id: '03',
        path: 'apps/web',
        title: 'Next.js (fullstack)',
        body: 'Present on rust-fullstack; omitted on rust-api-only.',
        code: 'NEXT_PUBLIC_API_URL=...',
      },
      {
        id: '04',
        path: 'migrations',
        title: 'SQL migrations',
        body: 'SQLx migrations when postgres/sqlite is selected.',
        code: 'sqlx migrate run',
      },
    ],
  },
}

export function ArchitectureGraph() {
  const [active, setActive] = useState<RouteId>('fullstack')
  const route = routes[active]

  return (
    <section className="overflow-hidden border-b border-zinc-800 bg-black py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionHeading eyebrow="Architecture" title="Three preset shapes">
          {route.summary}
        </SectionHeading>

        <div className="mb-10 flex flex-wrap gap-2">
          {(Object.keys(routes) as RouteId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`border px-4 py-2 font-mono text-xs tracking-widest uppercase transition-colors ${
                active === id
                  ? 'border-white bg-white text-black'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {routes[id].label}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute top-[104px] left-0 hidden h-px w-full border-b border-dashed border-zinc-800 lg:block" />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-4">
            {route.nodes.map((node, index) => (
              <m.article
                key={`${active}-${node.path}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.22, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
                whileHover={{ y: -6 }}
                className="flex flex-col border border-zinc-800 bg-black p-6 shadow-[8px_8px_0_0_rgba(39,39,42,1)] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-zinc-950 hover:shadow-[8px_8px_0_0_rgba(255,255,255,0.08)]"
              >
                <div className="mb-8 flex items-center justify-between gap-3">
                  <div className="flex size-10 items-center justify-center bg-white font-mono font-bold text-black tabular-nums">
                    {node.id}
                  </div>
                  <div className="border border-zinc-800 bg-zinc-900 px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-white uppercase">
                    {node.path}
                  </div>
                </div>
                <h3 className="mb-3 text-2xl leading-none font-bold text-balance text-white">
                  {node.title}
                </h3>
                <p className="mb-8 text-sm leading-relaxed font-medium text-pretty text-zinc-400">
                  {node.body}
                </p>
                <div className="mt-auto">
                  <CodePanel title="Boundary">
                    <code>{node.code}</code>
                  </CodePanel>
                </div>
              </m.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

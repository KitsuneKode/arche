'use client'

import { m } from 'motion/react'

export function StackDiagram() {
  const diagram = `┌─────────────────────────────────────┐
│ apps/web (Next.js)                  │
│  ↑ tRPC client                      │
├─────────────────────────────────────┤
│ packages/trpc (client contract)     │
│  ↑ types only                       │
├─────────────────────────────────────┤
│ apps/server (Express)               │
│  ├── modules/*/*.trpc.ts            │
│  ├── Better Auth (/api/auth/*)      │
│  └── tRPC endpoint (/api/trpc)      │
│  ↓                                  │
│ packages/store (Prisma client)      │
└─────────────────────────────────────┘`

  return (
    <div className="group w-full overflow-hidden border border-zinc-800 bg-black shadow-[4px_4px_0_0_rgba(39,39,42,1)] transition-all hover:shadow-[8px_8px_0_0_rgba(39,39,42,1)]">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-6 py-3 font-mono text-xs tracking-widest text-zinc-400 uppercase">
        <span className="size-2 animate-pulse bg-green-500" />
        Data Flow Diagram
      </div>
      <div className="overflow-x-auto p-6 md:p-8">
        <m.pre
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-fit font-mono text-sm leading-relaxed whitespace-pre text-zinc-300"
        >
          {diagram.split('\n').map((line, i) => {
            let highlighted = line
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')

            // Highlight package names
            highlighted = highlighted.replace(
              /apps\/web/g,
              '<span class="text-white font-bold">apps/web</span>',
            )
            highlighted = highlighted.replace(
              /packages\/trpc/g,
              '<span class="text-white font-bold">packages/trpc</span>',
            )
            highlighted = highlighted.replace(
              /apps\/server/g,
              '<span class="text-white font-bold">apps/server</span>',
            )
            highlighted = highlighted.replace(
              /packages\/store/g,
              '<span class="text-white font-bold">packages/store</span>',
            )

            // Highlight connections
            highlighted = highlighted.replace(
              /tRPC client/g,
              '<span class="text-blue-400">tRPC client</span>',
            )
            highlighted = highlighted.replace(
              /tRPC endpoint/g,
              '<span class="text-blue-400">tRPC endpoint</span>',
            )
            highlighted = highlighted.replace(
              /Better Auth/g,
              '<span class="text-amber-400">Better Auth</span>',
            )
            highlighted = highlighted.replace(
              /Prisma client/g,
              '<span class="text-green-400">Prisma client</span>',
            )

            // Highlight arrows
            highlighted = highlighted.replace(/↑/g, '<span class="text-zinc-500">↑</span>')
            highlighted = highlighted.replace(/↓/g, '<span class="text-zinc-500">↓</span>')
            highlighted = highlighted.replace(/├──/g, '<span class="text-zinc-500">├──</span>')
            highlighted = highlighted.replace(/└──/g, '<span class="text-zinc-500">└──</span>')

            return (
              <div
                key={i}
                dangerouslySetInnerHTML={{ __html: highlighted }}
                className="-mx-2 px-2 transition-colors hover:bg-zinc-900/50"
              />
            )
          })}
        </m.pre>
      </div>
    </div>
  )
}

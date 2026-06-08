'use client'

import { m } from 'motion/react'

const nodes = [
  {
    id: 'agents',
    label: 'AGENTS.md',
    role: 'Entry map for every agent',
    x: '8%',
    y: '12%',
  },
  {
    id: 'claude',
    label: 'CLAUDE.md',
    role: 'Symlink → AGENTS.md',
    x: '58%',
    y: '8%',
  },
  {
    id: 'docs',
    label: '.docs/',
    role: 'Internal architecture topics',
    x: '6%',
    y: '48%',
  },
  {
    id: 'plans',
    label: '.plans/active/',
    role: 'One approved in-flight plan',
    x: '52%',
    y: '44%',
  },
  {
    id: 'arche',
    label: 'arche.json',
    role: 'Machine-readable scaffold metadata',
    x: '34%',
    y: '62%',
  },
] as const

export function AgentContextMap() {
  return (
    <div className="not-prose my-10 overflow-hidden border border-zinc-800 bg-black shadow-[4px_4px_0_0_rgba(39,39,42,1)]">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-zinc-400 uppercase">
        <span className="size-2 animate-pulse bg-amber-500" aria-hidden />
        Agent context map
      </div>
      <div className="relative min-h-[300px] bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] p-4 pb-16 md:min-h-[340px] md:p-6 md:pb-20">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-zinc-700"
          aria-hidden
        >
          <line x1="22%" y1="22%" x2="48%" y2="52%" stroke="currentColor" strokeWidth="1" />
          <line x1="68%" y1="18%" x2="48%" y2="52%" stroke="currentColor" strokeWidth="1" />
          <line x1="22%" y1="58%" x2="48%" y2="52%" stroke="currentColor" strokeWidth="1" />
          <line x1="68%" y1="54%" x2="48%" y2="52%" stroke="currentColor" strokeWidth="1" />
          <line x1="48%" y1="52%" x2="42%" y2="82%" stroke="currentColor" strokeWidth="1" />
        </svg>
        {nodes.map((node, index) => (
          <m.div
            key={node.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
            className="absolute max-w-[11rem] border border-zinc-700 bg-zinc-950/90 p-3 backdrop-blur-sm"
            style={{ left: node.x, top: node.y }}
          >
            <div className="font-mono text-xs font-bold text-white">{node.label}</div>
            <div className="mt-1 text-[11px] leading-snug text-pretty text-zinc-500">
              {node.role}
            </div>
          </m.div>
        ))}
        <div className="absolute inset-x-4 bottom-4 z-10 border border-dashed border-zinc-700 bg-black/80 px-3 py-2 font-mono text-[10px] tracking-wide text-zinc-400 uppercase backdrop-blur-sm">
          Read root → nearest workspace AGENTS.md → one active plan
        </div>
      </div>
    </div>
  )
}

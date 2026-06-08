'use client'

import { m } from 'motion/react'

import { devScaffoldCommand } from '@/lib/presets-public'

type CommandRow = { cmd: string; desc: string }

function CommandTableSection({
  title,
  subtitle,
  commands,
}: {
  title: string
  subtitle: string
  commands: CommandRow[]
}) {
  return (
    <div className="w-full overflow-hidden border border-zinc-800 bg-black">
      <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-3">
        <div className="font-mono text-xs tracking-widest text-zinc-400 uppercase">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-pretty text-zinc-500">{subtitle}</p>
      </div>
      <div className="divide-y divide-zinc-800">
        {commands.map((c, i) => (
          <m.div
            key={c.cmd}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-4 px-6 py-4 transition-colors hover:bg-zinc-900/30 lg:flex-row lg:items-start"
          >
            <div className="min-w-0 flex-1 border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs leading-relaxed break-all text-white sm:text-sm">
              <span className="mr-2 text-zinc-500">$</span>
              {c.cmd}
            </div>
            <div className="shrink-0 text-sm font-medium text-pretty text-zinc-400 lg:max-w-[14rem]">
              {c.desc}
            </div>
          </m.div>
        ))}
      </div>
    </div>
  )
}

const devCliCommands: CommandRow[] = [
  {
    cmd: devScaffoldCommand('typescript-fullstack'),
    desc: 'TypeScript monorepo (Next + Express + tRPC + Prisma).',
  },
  {
    cmd: devScaffoldCommand('rust-api'),
    desc: 'Rust API workspace with Cargo and SQLx-ready layout.',
  },
  {
    cmd: devScaffoldCommand('convex-product'),
    desc: 'Next.js + Convex (no Express/Prisma monorepo).',
  },
  {
    cmd: devScaffoldCommand('solana-web'),
    desc: 'Solana web dApp with program and client boundaries.',
  },
  {
    cmd: 'bun run dev:cli -- my-app --family=convex --yes',
    desc: 'Legacy family flag (same template as convex-product).',
  },
  {
    cmd: 'bun run dev:cli -- validate \'{"projectName":"x",...}\'',
    desc: 'Validate a JSON config without writing files.',
  },
  {
    cmd: 'bun run dev:cli -- create-json \'{"projectName":"x",...}\'',
    desc: 'Non-interactive scaffold from JSON.',
  },
  {
    cmd: 'bun run dev:cli -- mcp',
    desc: 'stdio MCP server (plan, create, schema introspection).',
  },
]

const generatedProjectCommands: CommandRow[] = [
  { cmd: 'bun install', desc: 'Install dependencies in the generated workspace.' },
  { cmd: 'bun run dev', desc: 'Start dev servers (shape depends on preset).' },
  { cmd: 'bun run check-types', desc: 'Typecheck when the preset advertises it.' },
  { cmd: 'bunx convex dev', desc: 'Convex routes: link deployment and run functions locally.' },
]

const sourceTemplateCommands: CommandRow[] = [
  { cmd: 'bun dev', desc: 'Start all workspaces in this template monorepo.' },
  { cmd: 'bun run build', desc: 'Production build for this template monorepo.' },
  { cmd: 'bun run verify:generated', desc: 'Run generated-project verification matrix cases.' },
  { cmd: 'bun run repo:doctor', desc: 'Audit this source repo health and stale scaffolding.' },
]

function DevArcheCliCommandTable() {
  return (
    <CommandTableSection
      title="Develop from this repo"
      subtitle="Use dev:cli until the published @kitsunekode/arche release is explicitly trusted."
      commands={devCliCommands}
    />
  )
}

export function GeneratedProjectCommandTable() {
  return (
    <CommandTableSection
      title="Generated project"
      subtitle="Typical commands inside a scaffolded workspace after you cd into it."
      commands={generatedProjectCommands}
    />
  )
}

export function SourceTemplateCommandTable() {
  return (
    <CommandTableSection
      title="This source template"
      subtitle="Commands for developing the Arche template monorepo itself—not every generated app."
      commands={sourceTemplateCommands}
    />
  )
}

/** @deprecated Use DevArcheCliCommandTable */
export function ArcheCliCommandTable() {
  return <DevArcheCliCommandTable />
}

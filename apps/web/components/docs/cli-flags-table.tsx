const FLAGS = [
  { flag: '--yes', desc: 'Non-interactive defaults (CI, agents, repeatability).' },
  { flag: '--dir=<path>', desc: 'Parent directory or exact project path for output.' },
  { flag: '--preset=<id>', desc: 'Starting point from the registry (see Presets).' },
  { flag: '--family=<name>', desc: 'Legacy family selection when migrating old scripts.' },
  {
    flag: '--pm=bun|pnpm|npm',
    desc: 'Package manager. Bun default; pnpm first-class; npm experimental.',
  },
  { flag: '--backend=<name>', desc: 'Backend override on fullstack-capable routes.' },
  {
    flag: '--database=postgres|sqlite|none',
    desc: 'Database selection for supported routes.',
  },
  { flag: '--orm=prisma|drizzle|none', desc: 'ORM selection for supported routes.' },
  { flag: '--showcase / --no-showcase', desc: 'Keep or strip demo/showcase routes and content.' },
  { flag: '--worker / --no-worker', desc: 'Include or omit the BullMQ worker workspace.' },
  { flag: '--docker / --no-docker', desc: 'Generate or skip Dockerfiles and compose stubs.' },
  { flag: '--ci / --no-ci', desc: 'Generate or skip GitHub Actions CI workflows.' },
  { flag: '--deployment=<mode>', desc: 'Deployment documentation mode baked into generated docs.' },
  { flag: '--dry-run', desc: 'Print planned writes without touching disk.' },
] as const

export function CliFlagsTable() {
  return (
    <div className="not-prose my-8 overflow-hidden border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900">
            <th className="px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              Flag
            </th>
            <th className="px-4 py-2 font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              Purpose
            </th>
          </tr>
        </thead>
        <tbody>
          {FLAGS.map((row) => (
            <tr key={row.flag} className="border-b border-zinc-800/80 align-top">
              <td className="px-4 py-3 font-mono text-xs text-amber-200/90">{row.flag}</td>
              <td className="px-4 py-3 text-pretty text-zinc-400">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

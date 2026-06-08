const features = [
  {
    title: 'Typed boundaries',
    desc: 'tRPC and shared packages keep contracts explicit; app entrypoints stay thin.',
  },
  {
    title: 'Turbo-aware tasks',
    desc: 'Pipelines, affected checks, and boundaries—remote cache is optional, not assumed.',
  },
  {
    title: 'Auth as a module',
    desc: 'Better Auth in TypeScript presets; Rust services integrate through documented API edges.',
  },
  {
    title: 'Agent context',
    desc: 'One AGENTS.md map plus .docs and .plans so agents load the right slice—not the whole repo.',
  },
  {
    title: 'Deployment notes',
    desc: 'Vercel, Docker hosts, Neon, Upstash, and CI paths documented as composable choices.',
  },
  {
    title: 'Polyglot presets',
    desc: 'TypeScript apps, Rust workspaces, workers, and Solana foundations as explicit routes.',
  },
] as const

export function FeatureGrid() {
  return (
    <section className="grid grid-flow-dense auto-rows-fr grid-cols-1 gap-px border-y border-zinc-800 bg-zinc-800 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feat) => (
        <div
          key={feat.title}
          className="group bg-black p-8 transition-[background-color] duration-200 ease-out hover:bg-zinc-950"
        >
          <h3 className="mb-3 text-lg font-semibold tracking-tight text-balance text-white">
            {feat.title}
          </h3>
          <p className="text-sm leading-relaxed font-medium text-pretty text-zinc-400">
            {feat.desc}
          </p>
        </div>
      ))}
    </section>
  )
}

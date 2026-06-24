export function LiveDemoFallback({ label = 'Connecting to demo API…' }: { label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">{label}</p>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-96 animate-pulse border border-zinc-800 bg-zinc-950" />
        <div className="h-96 animate-pulse border border-zinc-800 bg-zinc-950" />
      </div>
    </div>
  )
}

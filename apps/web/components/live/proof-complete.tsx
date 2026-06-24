'use client'

export function ProofComplete({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <output className="motion-safe:animate-in motion-safe:fade-in block border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
      <p className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
        Proof complete
      </p>
      <p className="mt-1 font-mono text-xs text-emerald-100">
        All rungs passed — stack verified end-to-end. Receipt saved locally.
      </p>
    </output>
  )
}

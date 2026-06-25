'use client'

export function LatticeCell({
  label,
  unlocked,
  active,
}: {
  label: string
  unlocked: boolean
  active: boolean
}) {
  const base =
    'flex aspect-square items-center justify-center border p-1 text-center font-mono text-[9px] leading-tight tracking-wide uppercase transition-colors'
  const state = unlocked
    ? 'border-amber-500/60 bg-amber-500/10 text-amber-100'
    : 'border-zinc-800 bg-zinc-950 text-zinc-600'
  const ring = active ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''

  return <div className={`${base} ${state} ${ring}`}>{label}</div>
}

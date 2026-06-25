'use client'

import { useQuery } from '@tanstack/react-query'

import { ClashPanel } from '@/components/live/lattice/clash-panel'
import { LatticeCell } from '@/components/live/lattice/lattice-cell'
import { useLiveRoom } from '@/components/live/live-room-context'
import { DEFAULT_POLL_INTERVAL_MS } from '@/lib/live-feed'
import { useTRPC } from '@/trpc/client'

export function RelayLattice({ signedIn }: { signedIn: boolean }) {
  const trpc = useTRPC()
  const { mode } = useLiveRoom()
  const stateQuery = useQuery({
    ...trpc.lattice.getState.queryOptions(),
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false
      return mode === 'poll' ? DEFAULT_POLL_INTERVAL_MS : false
    },
  })

  const round = stateQuery.data?.round
  const activeIds = new Set(round ? [round.cellA.id, round.cellB.id] : [])

  return (
    <div className="space-y-4">
      <div className="border border-zinc-800 bg-black p-4">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
              Relay Lattice
            </p>
            <p className="mt-1 text-sm text-zinc-400">Pick a side. Light the grid.</p>
          </div>
          <p className="font-mono text-[10px] text-zinc-600">
            {stateQuery.data?.cells.filter((c) => c.unlocked).length ?? 0}/25 lit
          </p>
        </div>

        {stateQuery.isPending ? (
          <p className="font-mono text-xs text-zinc-600">Loading grid…</p>
        ) : stateQuery.isError ? (
          <p className="font-mono text-xs text-red-400">Grid unavailable.</p>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {stateQuery.data?.cells.map((cell) => (
              <LatticeCell
                key={cell.id}
                label={cell.label}
                unlocked={cell.unlocked}
                active={activeIds.has(cell.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ClashPanel signedIn={signedIn} />
    </div>
  )
}

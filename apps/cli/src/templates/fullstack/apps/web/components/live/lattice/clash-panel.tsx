'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useLiveRoom } from '@/components/live/live-room-context'
import { DEFAULT_POLL_INTERVAL_MS } from '@/lib/live-feed'
import { useTRPC } from '@/trpc/client'

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function ClashPanel({ signedIn }: { signedIn: boolean }) {
  const trpc = useTRPC()
  const { mode, pollingFallback } = useLiveRoom()
  const stateQuery = useQuery({
    ...trpc.lattice.getState.queryOptions(),
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false
      return mode === 'poll' ? DEFAULT_POLL_INTERVAL_MS : false
    },
  })

  const voteMutation = useMutation(trpc.lattice.vote.mutationOptions())

  const round = stateQuery.data?.round
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!round || round.status !== 'open') return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [round])

  if (stateQuery.isPending) {
    return (
      <div className="border border-zinc-800 bg-black p-6">
        <p className="font-mono text-xs text-zinc-600">Loading clash…</p>
      </div>
    )
  }

  if (stateQuery.isError || !round) {
    return (
      <div className="border border-zinc-800 bg-black p-6">
        <p className="font-mono text-xs text-red-400">Lattice unavailable — API may be offline.</p>
      </div>
    )
  }

  const endsAt = new Date(round.endsAt).getTime()
  const remaining = endsAt - now
  const totalVotes = round.votesA + round.votesB
  const percentA = totalVotes > 0 ? Math.round((round.votesA / totalVotes) * 100) : 50

  const vote = (choice: 'a' | 'b') => {
    if (!signedIn || voteMutation.isPending || round.status !== 'open' || remaining <= 0) return
    voteMutation.mutate({ roundId: round.id, choice })
  }

  return (
    <div className="border border-zinc-800 bg-black">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
            Clash #{round.roundNumber}
          </p>
          <p className="mt-1 text-sm text-zinc-400">Pick a side before the relay locks.</p>
        </div>
        <span
          className={`border px-2 py-1 font-mono text-[10px] tracking-widest uppercase ${
            pollingFallback
              ? 'border-amber-500/40 text-amber-300'
              : 'border-emerald-500/40 text-emerald-300'
          }`}
        >
          {pollingFallback ? 'Polling' : 'Live'}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          <span>Time left</span>
          <span className="text-white">{formatCountdown(remaining)}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => vote('a')}
            disabled={!signedIn || voteMutation.isPending || remaining <= 0}
            className={`border px-4 py-6 text-left transition-colors ${
              round.myVote === 'a'
                ? 'border-amber-400 bg-amber-500/15'
                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
            } disabled:opacity-50`}
          >
            <p className="font-mono text-[10px] text-zinc-500 uppercase">Side A</p>
            <p className="mt-2 font-mono text-sm font-bold text-white">{round.cellA.label}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{round.votesA} votes</p>
          </button>
          <button
            type="button"
            onClick={() => vote('b')}
            disabled={!signedIn || voteMutation.isPending || remaining <= 0}
            className={`border px-4 py-6 text-left transition-colors ${
              round.myVote === 'b'
                ? 'border-amber-400 bg-amber-500/15'
                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
            } disabled:opacity-50`}
          >
            <p className="font-mono text-[10px] text-zinc-500 uppercase">Side B</p>
            <p className="mt-2 font-mono text-sm font-bold text-white">{round.cellB.label}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{round.votesB} votes</p>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between font-mono text-[10px] text-zinc-600">
            <span>{round.cellA.label}</span>
            <span>{round.cellB.label}</span>
          </div>
          <div className="flex h-2 overflow-hidden border border-zinc-800 bg-zinc-950">
            <div className="bg-amber-500/80 transition-all" style={{ width: `${percentA}%` }} />
            <div className="flex-1 bg-zinc-800" />
          </div>
          <p className="font-mono text-[10px] text-zinc-600">{totalVotes} votes this clash</p>
        </div>

        {!signedIn ? (
          <p className="font-mono text-[10px] text-zinc-600">
            Sign in below to vote — spectators can watch the grid light up in real time.
          </p>
        ) : null}

        {voteMutation.isError ? (
          <p className="font-mono text-xs text-red-400">{voteMutation.error.message}</p>
        ) : null}
      </div>
    </div>
  )
}

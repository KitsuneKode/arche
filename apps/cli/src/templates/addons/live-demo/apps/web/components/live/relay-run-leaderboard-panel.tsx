'use client'

import { Badge } from '@arche-template/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@arche-template/ui/components/card'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import {
  readCachedLeaderboard,
  writeCachedLeaderboard,
  type CachedLeaderboardEntry,
} from '@/lib/relay-run/offline'
import { useTRPC } from '@/trpc/client'

function LeaderboardList({
  entries,
  signedInUserId,
}: {
  entries: CachedLeaderboardEntry[]
  signedInUserId?: string
}) {
  if (!entries.length) {
    return <li className="text-zinc-600">No scores yet — be first.</li>
  }

  return (
    <>
      {entries.slice(0, 10).map((entry) => {
        const isYou = signedInUserId === entry.userId
        return (
          <li
            key={entry.userId}
            className={`flex items-center justify-between gap-2 border px-2 py-1.5 ${
              isYou ? 'border-amber-900/50 bg-amber-950/20' : 'border-zinc-800 bg-zinc-950/40'
            }`}
          >
            <span className="flex items-center gap-2 text-zinc-400">
              <Badge
                variant="outline"
                className="h-5 min-w-8 justify-center border-zinc-700 font-mono text-[10px]"
              >
                #{entry.rank}
              </Badge>
              <span className={isYou ? 'text-amber-300' : undefined}>
                {entry.displayName}
                {isYou ? ' (you)' : ''}
              </span>
            </span>
            <span className="text-amber-400">{entry.score}</span>
          </li>
        )
      })}
    </>
  )
}

export function RelayRunLeaderboardPanel({
  signedInUserId,
  offline,
}: {
  signedInUserId?: string
  offline?: boolean
}) {
  const trpc = useTRPC()
  const leaderboardQuery = useQuery({
    ...trpc.game.leaderboard.queryOptions(),
    enabled: !offline,
  })

  const [cached, setCached] = useState<CachedLeaderboardEntry[]>(() =>
    typeof window === 'undefined' ? [] : readCachedLeaderboard(),
  )

  const showCached = offline || leaderboardQuery.isError

  useEffect(() => {
    if (!leaderboardQuery.data?.length) return
    writeCachedLeaderboard(leaderboardQuery.data)
    setCached(readCachedLeaderboard())
  }, [leaderboardQuery.data])

  useEffect(() => {
    if (!offline) return
    setCached(readCachedLeaderboard())
  }, [offline])

  const entries = showCached ? cached : (leaderboardQuery.data ?? [])

  return (
    <Card className="h-full border-zinc-800 bg-black ring-zinc-800">
      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
            Leaderboard
          </CardTitle>
          {showCached && cached.length > 0 ? (
            <Badge
              variant="outline"
              className="border-zinc-700 font-mono text-[10px] text-zinc-500"
            >
              Offline snapshot
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="max-h-[min(52vh,420px)] overflow-y-auto">
        {!offline && leaderboardQuery.isPending ? (
          <p className="font-mono text-xs text-zinc-600">Loading…</p>
        ) : showCached && !cached.length ? (
          <p className="font-mono text-xs text-amber-400">
            Offline — play locally and your best is saved on this device.
          </p>
        ) : !offline && leaderboardQuery.isError && !cached.length ? (
          <p className="font-mono text-xs text-amber-400">
            Could not load leaderboard — API may be offline.
          </p>
        ) : (
          <ol className="space-y-2 font-mono text-xs">
            <LeaderboardList entries={entries} signedInUserId={signedInUserId} />
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

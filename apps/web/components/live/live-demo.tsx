'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { ActivityDeck } from '@/components/live/activity-deck'
import { ProofLadder } from '@/components/live/proof-ladder'
import { useApiReachable } from '@/lib/use-api-reachable'
import { useTRPC } from '@/trpc/client'

function ApiOfflinePanel() {
  return (
    <div className="border border-zinc-800 bg-black p-8">
      <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">API offline</p>
      <h2 className="mt-3 text-2xl font-bold text-white">Live demo needs a running API</h2>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
        Set <code className="text-zinc-300">NEXT_PUBLIC_API_URL</code> to your Express host, migrate
        the database, and run <code className="text-zinc-300">bun run db:seed</code>. See the{' '}
        <Link href="/docs/guides/live-demo" className="text-white underline">
          live demo guide
        </Link>
        . You can still try{' '}
        <Link href="/play" className="text-white underline">
          Relay
        </Link>{' '}
        for chat and latency checks when the API returns.
      </p>
    </div>
  )
}

export function LiveDemo() {
  const trpc = useTRPC()
  const health = useApiReachable()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const userId = sessionQuery.data?.user?.id

  if (health.isPending) {
    return (
      <div className="border border-zinc-800 bg-black p-8">
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Checking API…
        </p>
        <p className="mt-3 text-sm text-zinc-400">Probing the demo API health endpoint.</p>
      </div>
    )
  }

  if (health.isConfirmedOffline) {
    return <ApiOfflinePanel />
  }

  const showReconnectBanner = health.seededOnline && health.isRefetching

  return (
    <div className="space-y-4">
      {showReconnectBanner ? (
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Re-checking API connection…
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProofLadder
          apiReachable={health.status.reachable || health.seededOnline}
          signedIn={signedIn}
          userId={userId}
        />
        <ActivityDeck
          signedIn={signedIn}
          userId={userId}
          onSignedIn={() => {
            void sessionQuery.refetch()
          }}
        />
      </div>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { ActivityDeck } from '@/components/live/activity-deck'
import { ProofLadder } from '@/components/live/proof-ladder'
import { useApiReachable } from '@/lib/use-api-reachable'
import { useTRPC } from '@/trpc/client'

function ApiOfflineBanner() {
  return (
    <div className="border border-amber-900/40 bg-amber-950/20 p-4">
      <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">API offline</p>
      <p className="mt-2 text-sm text-zinc-400">
        The demo API is not reachable. Check{' '}
        <code className="text-zinc-300">NEXT_PUBLIC_API_URL</code> or see the{' '}
        <Link href="/docs/guides/live-demo" className="text-white underline">
          live demo guide
        </Link>
        . Try{' '}
        <Link href="/play" className="text-white underline">
          Relay
        </Link>{' '}
        when the API is back.
      </p>
    </div>
  )
}

export function LiveDemo() {
  const trpc = useTRPC()
  const healthQuery = useApiReachable()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const userId = sessionQuery.data?.user?.id

  const apiReachable = healthQuery.data?.reachable === true
  const stillChecking = !healthQuery.isFetched
  const confirmedOffline =
    healthQuery.isFetched && healthQuery.data?.reachable === false && !healthQuery.isFetching

  return (
    <div className="space-y-4">
      {stillChecking ? (
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Connecting to demo API…
        </p>
      ) : null}
      {confirmedOffline ? <ApiOfflineBanner /> : null}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProofLadder
          apiReachable={apiReachable || stillChecking}
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

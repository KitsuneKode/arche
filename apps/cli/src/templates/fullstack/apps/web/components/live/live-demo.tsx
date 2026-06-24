'use client'

import { useQuery } from '@tanstack/react-query'

import { ActivityDeck } from '@/components/live/activity-deck'
import { ProofLadder } from '@/components/live/proof-ladder'
import { useApiReachable } from '@/lib/use-api-reachable'
import { useTRPC } from '@/trpc/client'

export function LiveDemo() {
  const trpc = useTRPC()
  const health = useApiReachable()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const userId = sessionQuery.data?.user?.id

  if (health.isPending) {
    return (
      <div className="card">
        <p className="eyebrow">Checking API…</p>
        <p className="lede">Probing the API health endpoint.</p>
      </div>
    )
  }

  if (health.isConfirmedOffline) {
    return (
      <div className="card">
        <p className="eyebrow">API offline</p>
        <h2>Live demo needs a running API</h2>
        <p className="lede">
          Set <code>NEXT_PUBLIC_API_URL</code> to your API host, migrate the database, and run{' '}
          <code>bun run db:seed</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {health.seededOnline && health.isRefetching ? (
        <p className="eyebrow">Re-checking API connection…</p>
      ) : null}
      <div className="grid two">
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

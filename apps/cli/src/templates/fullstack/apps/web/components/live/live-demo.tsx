'use client'

import { useQuery } from '@tanstack/react-query'

import { ActivityDeck } from '@/components/live/activity-deck'
import { ProofLadder } from '@/components/live/proof-ladder'
import { useApiReachable } from '@/lib/use-api-reachable'
import { useTRPC } from '@/trpc/client'

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
      {stillChecking ? <p className="eyebrow">Connecting to demo API…</p> : null}
      {confirmedOffline ? (
        <div className="card">
          <p className="eyebrow">API offline</p>
          <p className="lede">
            Set <code>NEXT_PUBLIC_API_URL</code> to your API host and ensure the health endpoint
            returns <code>database: connected</code>.
          </p>
        </div>
      ) : null}
      <div className="grid two">
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

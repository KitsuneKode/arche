'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'

import { LiveDemoFooter } from '@/components/live/live-demo-footer'
import { LiveRoomProvider } from '@/components/live/live-room-context'
import { ProofLadder } from '@/components/live/proof-ladder'
import { RelayChatPopup } from '@/components/live/relay-chat-popup'
import { RelayRunGame } from '@/components/live/relay-run-game'
import { SessionPanel } from '@/components/live/session-panel'
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
        .
      </p>
    </div>
  )
}

function LiveDemoInner() {
  const trpc = useTRPC()
  const healthQuery = useApiReachable()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const userId = sessionQuery.data?.user?.id
  const [showSignIn, setShowSignIn] = useState(false)

  const apiReachable = healthQuery.data?.reachable === true
  const stillChecking = !healthQuery.isFetched
  const confirmedOffline =
    healthQuery.isFetched && healthQuery.data?.reachable === false && !healthQuery.isFetching

  return (
    <div className="space-y-6">
      {stillChecking ? (
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Connecting to demo API…
        </p>
      ) : null}
      {confirmedOffline ? <ApiOfflineBanner /> : null}

      <div className="relative grid h-[min(78vh,880px)] min-h-[520px] gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ProofLadder
          apiReachable={apiReachable || stillChecking}
          signedIn={signedIn}
          userId={userId}
        />
        <RelayRunGame signedIn={signedIn} onSignInClick={() => setShowSignIn(true)} />
      </div>

      <RelayChatPopup
        signedIn={signedIn}
        userId={userId}
        onSignInClick={() => setShowSignIn(true)}
      />

      {showSignIn && !signedIn ? (
        <div className="border border-zinc-800 bg-black p-4">
          <SessionPanel
            onSignedIn={() => {
              setShowSignIn(false)
              void sessionQuery.refetch()
            }}
          />
        </div>
      ) : null}

      <LiveDemoFooter
        signedIn={signedIn}
        onSignedIn={() => {
          void sessionQuery.refetch()
        }}
        onOpenYou={() => setShowSignIn(true)}
      />
    </div>
  )
}

export function LiveDemo() {
  return (
    <LiveRoomProvider>
      <LiveDemoInner />
    </LiveRoomProvider>
  )
}

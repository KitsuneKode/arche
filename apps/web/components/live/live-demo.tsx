'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'

import { ActivityDeck, type ActivityTab } from '@/components/live/activity-deck'
import { LiveRoomProvider, useLiveRoom } from '@/components/live/live-room-context'
import { ProofLadder } from '@/components/live/proof-ladder'
import { RelayChatPopup } from '@/components/live/relay-chat-popup'
import { RelayRunGame } from '@/components/live/relay-run-game'
import { isRegisteredUser } from '@/lib/ensure-guest-session'
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
  const { openRelayChat } = useLiveRoom()
  const healthQuery = useApiReachable()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const isRegistered = isRegisteredUser(sessionQuery.data)
  const userId = sessionQuery.data?.user?.id
  const [activityTab, setActivityTab] = useState<ActivityTab>('chat')
  const activityDeckRef = useRef<HTMLDivElement>(null)

  const openSignIn = useCallback(() => {
    setActivityTab('you')
  }, [])

  const openChat = useCallback(() => {
    setActivityTab('chat')
    openRelayChat()
    activityDeckRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [openRelayChat])

  const handleSignedIn = useCallback(() => {
    void sessionQuery.refetch()
  }, [sessionQuery])

  const apiReachable = healthQuery.data?.reachable === true
  const stillChecking = !healthQuery.isFetched
  const confirmedOffline =
    healthQuery.isFetched && healthQuery.data?.reachable === false && !healthQuery.isFetching

  return (
    <div className="min-w-0 space-y-4">
      {stillChecking ? (
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Connecting to demo API…
        </p>
      ) : null}
      {confirmedOffline ? <ApiOfflineBanner /> : null}

      <div className="relative grid min-w-0 gap-3 overflow-hidden lg:h-[min(75vh,800px)] lg:min-h-[480px] lg:grid-cols-[1.4fr_0.6fr]">
        <div className="min-h-[min(58vh,520px)] min-w-0 overflow-hidden lg:min-h-0">
          <RelayRunGame
            signedIn={signedIn}
            isRegistered={isRegistered}
            userId={userId}
            apiReachable={apiReachable || stillChecking}
            onSignInClick={openSignIn}
            onOpenChat={openChat}
          />
        </div>
        <div ref={activityDeckRef} className="min-h-0 min-w-0 overflow-hidden max-lg:max-h-[34vh]">
          <ActivityDeck
            signedIn={signedIn}
            isRegistered={isRegistered}
            guestPostEnabled={apiReachable}
            userId={userId}
            tab={activityTab}
            onTabChange={setActivityTab}
            onSignedIn={handleSignedIn}
          />
        </div>
      </div>

      <ProofLadder
        apiReachable={apiReachable || stillChecking}
        signedIn={signedIn}
        userId={userId}
      />

      <RelayChatPopup
        signedIn={signedIn}
        guestPostEnabled={apiReachable || stillChecking}
        userId={userId}
        onSignInClick={openSignIn}
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

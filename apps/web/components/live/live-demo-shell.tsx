'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

import type { RouterOutputs } from '@arche-template/trpc'
import { ActivityDeck, type ActivityTab } from '@/components/live/activity-deck'
import { LiveRoomProvider, useLiveRoom } from '@/components/live/live-room-context'
import { ProofLadder } from '@/components/live/proof-ladder'
import { RelayChatPopup } from '@/components/live/relay-chat-popup'
import { RelayRunGame } from '@/components/live/relay-run-game'
import { StackLab } from '@/components/live/stack-lab/stack-lab'
import { isRegisteredUser } from '@/lib/ensure-guest-session'
import { LIVE_TABS, liveTabLabel, parseLiveTab, type LiveExperienceTab } from '@/lib/live-tab'
import { useApiReachable } from '@/lib/use-api-reachable'
import { useBootstrapGuestSession } from '@/lib/use-bootstrap-guest-session'
import { useTRPC } from '@/trpc/client'

type StackSnapshot = RouterOutputs['demo']['stackSnapshot']

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

function LiveExperienceTabsInner({ initialSnapshot }: { initialSnapshot: StackSnapshot | null }) {
  const trpc = useTRPC()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { openRelayChat } = useLiveRoom()

  const tab = parseLiveTab(searchParams.get('tab'))
  const [roomActivityTab, setRoomActivityTab] = useState<ActivityTab>('chat')

  const healthQuery = useApiReachable()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const isRegistered = isRegisteredUser(sessionQuery.data)
  const userId = sessionQuery.data?.user?.id

  const setTab = useCallback(
    (next: LiveExperienceTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'play') params.delete('tab')
      else params.set('tab', next)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const openSignIn = useCallback(() => {
    setTab('room')
    setRoomActivityTab('you')
  }, [setTab])

  const openChat = useCallback(() => {
    setTab('room')
    setRoomActivityTab('chat')
    openRelayChat()
  }, [openRelayChat, setTab])

  const handleSignedIn = useCallback(() => {
    void sessionQuery.refetch()
  }, [sessionQuery])

  const apiReachable = healthQuery.data?.reachable === true
  const stillChecking = !healthQuery.isFetched
  const confirmedOffline =
    healthQuery.isFetched && healthQuery.data?.reachable === false && !healthQuery.isFetching

  useBootstrapGuestSession({
    enabled: apiReachable,
    hasSession: signedIn,
    isRegistered,
    sessionFetched: sessionQuery.isFetched,
  })

  return (
    <div className="min-w-0 space-y-4">
      {stillChecking ? (
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
          Connecting to demo API…
        </p>
      ) : null}
      {confirmedOffline ? <ApiOfflineBanner /> : null}

      <div className="flex shrink-0 border border-zinc-800 bg-zinc-950 font-mono text-[10px] tracking-widest uppercase">
        {LIVE_TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`flex-1 px-3 py-2.5 transition-colors ${
              tab === item ? 'bg-black text-white' : 'text-zinc-600 hover:text-zinc-300'
            }`}
            aria-current={tab === item ? 'page' : undefined}
          >
            {liveTabLabel(item)}
          </button>
        ))}
      </div>

      <div className="min-w-0 overflow-hidden">
        {tab === 'play' ? (
          <div className="min-h-[min(58vh,520px)] min-w-0 overflow-hidden lg:min-h-[min(75vh,800px)]">
            <RelayRunGame
              signedIn={signedIn}
              isRegistered={isRegistered}
              userId={userId}
              apiReachable={apiReachable || stillChecking}
              onSignInClick={openSignIn}
              onOpenChat={openChat}
            />
          </div>
        ) : null}

        {tab === 'lab' ? (
          <div className="max-h-[min(75vh,800px)] overflow-y-auto">
            <StackLab initialSnapshot={initialSnapshot} onOpenRoom={() => setTab('room')} />
          </div>
        ) : null}

        {tab === 'room' ? (
          <div className="h-[min(75vh,800px)] min-h-[420px]">
            <ActivityDeck
              signedIn={signedIn}
              isRegistered={isRegistered}
              guestPostEnabled={apiReachable}
              userId={userId}
              tab={roomActivityTab}
              onTabChange={setRoomActivityTab}
              onSignedIn={handleSignedIn}
            />
          </div>
        ) : null}
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

export function LiveDemoShell({ initialSnapshot }: { initialSnapshot: StackSnapshot | null }) {
  return (
    <LiveRoomProvider>
      <LiveExperienceTabsInner initialSnapshot={initialSnapshot} />
    </LiveRoomProvider>
  )
}

/** @deprecated Use LiveDemoShell from the RSC page. */
export function LiveDemo() {
  return <LiveDemoShell initialSnapshot={null} />
}

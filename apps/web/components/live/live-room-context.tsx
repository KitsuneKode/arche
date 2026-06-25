'use client'

import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import type { RouterOutputs } from '@arche-template/trpc'
import { liveStreamUrl } from '@/lib/live-chat-sync'
import {
  createLiveFeed,
  DEFAULT_POLL_INTERVAL_MS,
  resolveLiveFeedMode,
  type LiveFeedMode,
  type LiveStreamClientEvent,
} from '@/lib/live-feed'
import { useTRPC } from '@/trpc/client'

type LatticeState = RouterOutputs['lattice']['getState']

type LiveRoomContextValue = {
  mode: LiveFeedMode
  pollingFallback: boolean
}

const LiveRoomContext = createContext<LiveRoomContextValue | null>(null)

export function LiveRoomProvider({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const preferredMode = resolveLiveFeedMode()
  const [mode, setMode] = useState<LiveFeedMode>(preferredMode)

  const onEvent = useCallback(
    (event: LiveStreamClientEvent) => {
      if (event.type === 'chat:message') {
        void queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() })
        return
      }
      if (event.type === 'lattice:state') {
        queryClient.setQueryData(trpc.lattice.getState.queryKey(), event.state as LatticeState)
      }
    },
    [queryClient, trpc.chat.list, trpc.lattice.getState],
  )

  const onPollTick = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() })
    void queryClient.invalidateQueries({ queryKey: trpc.lattice.getState.queryKey() })
  }, [queryClient, trpc.chat.list, trpc.lattice.getState])

  const handlersRef = useRef({ onEvent, onPollTick })
  handlersRef.current = { onEvent, onPollTick }

  useEffect(() => {
    const feed = createLiveFeed({
      streamUrl: liveStreamUrl(),
      onEvent: (event) => handlersRef.current.onEvent(event),
      onInvalidate: () => handlersRef.current.onPollTick(),
      pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      preferSse: preferredMode === 'sse',
      onModeChange: setMode,
    })

    feed.start()
    setMode(feed.getMode())

    return () => {
      feed.stop()
    }
  }, [preferredMode])

  const value = useMemo(() => ({ mode, pollingFallback: mode === 'poll' }), [mode])

  return <LiveRoomContext.Provider value={value}>{children}</LiveRoomContext.Provider>
}

export function useLiveRoom() {
  const context = useContext(LiveRoomContext)
  if (!context) {
    return { mode: resolveLiveFeedMode(), pollingFallback: !isChatSseEnabled() }
  }
  return context
}

function isChatSseEnabled() {
  return resolveLiveFeedMode() === 'sse'
}

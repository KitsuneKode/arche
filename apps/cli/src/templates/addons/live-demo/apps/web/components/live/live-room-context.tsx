'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'

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
  relayChatOpen: boolean
  openRelayChat: () => void
  closeRelayChat: () => void
  registerFullscreenHost: (host: HTMLElement | null) => void
  fullscreenHostRef: RefObject<HTMLElement | null>
}

const LiveRoomContext = createContext<LiveRoomContextValue | null>(null)

export function LiveRoomProvider({ children }: { children: React.ReactNode }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const preferredMode = resolveLiveFeedMode()
  const [mode, setMode] = useState<LiveFeedMode>(preferredMode)
  const [relayChatOpen, setRelayChatOpen] = useState(false)
  const fullscreenHostRef = useRef<HTMLElement | null>(null)

  const openRelayChat = useCallback(() => {
    setRelayChatOpen(true)
  }, [])

  const closeRelayChat = useCallback(() => {
    setRelayChatOpen(false)
  }, [])

  const registerFullscreenHost = useCallback((host: HTMLElement | null) => {
    fullscreenHostRef.current = host
  }, [])

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

  const value = useMemo(
    () => ({
      mode,
      pollingFallback: mode === 'poll',
      relayChatOpen,
      openRelayChat,
      closeRelayChat,
      registerFullscreenHost,
      fullscreenHostRef,
    }),
    [mode, relayChatOpen, openRelayChat, closeRelayChat, registerFullscreenHost],
  )

  return <LiveRoomContext.Provider value={value}>{children}</LiveRoomContext.Provider>
}

const fallbackFullscreenHostRef = { current: null as HTMLElement | null }

export function useLiveRoom() {
  const context = useContext(LiveRoomContext)
  if (!context) {
    return {
      mode: resolveLiveFeedMode(),
      pollingFallback: !isChatSseEnabled(),
      relayChatOpen: false,
      openRelayChat: () => {},
      closeRelayChat: () => {},
      registerFullscreenHost: () => {},
      fullscreenHostRef: fallbackFullscreenHostRef,
    }
  }
  return context
}

/** Portal target: game fullscreen host when active, otherwise document.body */
export function useChatPortalTarget(): HTMLElement | null {
  const { fullscreenHostRef } = useLiveRoom()
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const resolve = () => {
      const host = fullscreenHostRef.current
      if (host && document.fullscreenElement === host) {
        setTarget(host)
        return
      }
      setTarget(document.body)
    }

    resolve()
    document.addEventListener('fullscreenchange', resolve)
    return () => document.removeEventListener('fullscreenchange', resolve)
  }, [fullscreenHostRef])

  return target
}

export function useGameFullscreenActive(): boolean {
  const { fullscreenHostRef } = useLiveRoom()
  const [active, setActive] = useState(false)

  useEffect(() => {
    const resolve = () => {
      const host = fullscreenHostRef.current
      setActive(Boolean(host && document.fullscreenElement === host))
    }

    resolve()
    document.addEventListener('fullscreenchange', resolve)
    return () => document.removeEventListener('fullscreenchange', resolve)
  }, [fullscreenHostRef])

  return active
}

function isChatSseEnabled() {
  return resolveLiveFeedMode() === 'sse'
}

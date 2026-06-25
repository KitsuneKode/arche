'use client'

import { useEffect, useRef, useState } from 'react'

import { chatStreamUrl } from '@/lib/live-chat-sync'
import {
  createLiveFeed,
  DEFAULT_POLL_INTERVAL_MS,
  resolveLiveFeedMode,
  type LiveFeedMode,
} from '@/lib/live-feed'

export function useChatStream(onMessage: () => void, enabled = true) {
  const preferredMode = resolveLiveFeedMode()
  const [mode, setMode] = useState<LiveFeedMode>(preferredMode)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!enabled) return

    const feed = createLiveFeed({
      streamUrl: chatStreamUrl(),
      onEvent: (event) => {
        if (event.type === 'chat:message') onMessageRef.current()
      },
      onInvalidate: () => onMessageRef.current(),
      pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
      preferSse: preferredMode === 'sse',
      onModeChange: setMode,
    })

    feed.start()
    setMode(feed.getMode())

    return () => {
      feed.stop()
    }
  }, [enabled, preferredMode])

  return {
    mode,
    pollingFallback: mode === 'poll',
  }
}

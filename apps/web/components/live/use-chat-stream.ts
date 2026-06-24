'use client'

import { useEffect, useRef, useState } from 'react'

import { chatStreamUrl } from '@/lib/live-chat-sync'
import { isChatSseEnabled } from '@/lib/live-chat-sync-policy'

export function useChatStream(onMessage: () => void, enabled = true) {
  const sseAllowed = isChatSseEnabled()
  const [pollingFallback, setPollingFallback] = useState(!sseAllowed)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!enabled || pollingFallback || !sseAllowed) return
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setPollingFallback(true)
      return
    }

    const source = new EventSource(chatStreamUrl())

    const handleMessage = () => {
      onMessageRef.current()
    }

    source.addEventListener('message', handleMessage)
    source.addEventListener('heartbeat', () => {
      // keep-alive only
    })

    source.onerror = () => {
      source.close()
      setPollingFallback(true)
    }

    return () => {
      source.removeEventListener('message', handleMessage)
      source.close()
    }
  }, [enabled, pollingFallback, sseAllowed])

  return { pollingFallback }
}

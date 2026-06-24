import { isChatSseEnabled } from '@/lib/live-chat-sync-policy'

export type LiveFeedMode = 'sse' | 'poll'

export const DEFAULT_POLL_INTERVAL_MS = 2_000

export function resolveLiveFeedMode(): LiveFeedMode {
  return isChatSseEnabled() ? 'sse' : 'poll'
}

export type LiveFeedHandle = {
  start: () => void
  stop: () => void
  getMode: () => LiveFeedMode
}

export type CreateLiveFeedOptions = {
  streamUrl: string
  onInvalidate: () => void
  pollIntervalMs?: number
  preferSse?: boolean
  onModeChange?: (mode: LiveFeedMode) => void
  eventSourceFactory?: (url: string) => EventSourceLike
}

/** Minimal EventSource surface for tests and SSR guards. */
export type EventSourceLike = {
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
  close: () => void
  onerror: ((this: EventSourceLike, ev: Event) => void) | null
}

function defaultEventSourceFactory(url: string): EventSourceLike {
  return new EventSource(url) as unknown as EventSourceLike
}

/**
 * LiveFeed — single seam for chat realtime sync (SSE or polling fallback).
 */
export function createLiveFeed(options: CreateLiveFeedOptions): LiveFeedHandle {
  const {
    streamUrl,
    onInvalidate,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    preferSse = isChatSseEnabled(),
    onModeChange,
  } = options
  const eventSourceFactory = options.eventSourceFactory ?? defaultEventSourceFactory
  const canUseSse =
    preferSse && (typeof EventSource !== 'undefined' || options.eventSourceFactory !== undefined)

  let mode: LiveFeedMode = preferSse ? 'sse' : 'poll'
  let stopped = false
  let source: EventSourceLike | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let messageListener: (() => void) | null = null

  const setMode = (next: LiveFeedMode) => {
    mode = next
    onModeChange?.(next)
  }

  const startPoll = () => {
    if (pollTimer) return
    setMode('poll')
    pollTimer = setInterval(onInvalidate, pollIntervalMs)
  }

  const start = () => {
    if (stopped) return

    if (!canUseSse) {
      startPoll()
      return
    }

    setMode('sse')
    source = eventSourceFactory(streamUrl)
    messageListener = () => {
      onInvalidate()
    }
    source.addEventListener('message', messageListener)
    source.addEventListener('heartbeat', () => {
      // keep-alive only
    })
    source.onerror = () => {
      source?.close()
      source = null
      onInvalidate()
      startPoll()
    }
  }

  const stop = () => {
    stopped = true
    if (source && messageListener) {
      source.removeEventListener('message', messageListener)
      source.close()
      source = null
      messageListener = null
    }
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    start,
    stop,
    getMode: () => mode,
  }
}

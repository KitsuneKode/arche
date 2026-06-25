import { isChatSseEnabled } from '@/lib/live-chat-sync-policy'

export type LiveFeedMode = 'sse' | 'poll'

export const DEFAULT_POLL_INTERVAL_MS = 2_000

export function resolveLiveFeedMode(): LiveFeedMode {
  return isChatSseEnabled() ? 'sse' : 'poll'
}

export type LiveStreamClientEvent =
  | { type: 'chat:message'; messageId: string }
  | { type: 'lattice:state'; state: unknown }

export type LiveFeedHandle = {
  start: () => void
  stop: () => void
  getMode: () => LiveFeedMode
}

export type CreateLiveFeedOptions = {
  streamUrl: string
  onEvent?: (event: LiveStreamClientEvent) => void
  /** Poll fallback and legacy chat-only invalidation. */
  onInvalidate?: () => void
  pollIntervalMs?: number
  preferSse?: boolean
  onModeChange?: (mode: LiveFeedMode) => void
  eventSourceFactory?: (url: string) => EventSourceLike
}

/** Minimal EventSource surface for tests and SSR guards. */
export type EventSourceLike = {
  addEventListener: (type: string, listener: (event: { data: string }) => void) => void
  removeEventListener: (type: string, listener: (event: { data: string }) => void) => void
  close: () => void
  onerror: ((this: EventSourceLike, ev: Event) => void) | null
}

function defaultEventSourceFactory(url: string): EventSourceLike {
  return new EventSource(url) as unknown as EventSourceLike
}

function parseClientEvent(type: string, data: string): LiveStreamClientEvent | null {
  try {
    const payload = JSON.parse(data) as Record<string, unknown>
    if (type === 'chat:message' && typeof payload.messageId === 'string') {
      return { type: 'chat:message', messageId: payload.messageId }
    }
    if (type === 'lattice:state') {
      return { type: 'lattice:state', state: payload }
    }
    if (type === 'message' && typeof payload.messageId === 'string') {
      return { type: 'chat:message', messageId: payload.messageId }
    }
  } catch {
    return null
  }
  return null
}

/**
 * LiveFeed — SSE multiplex or polling fallback for the unified live room.
 */
export function createLiveFeed(options: CreateLiveFeedOptions): LiveFeedHandle {
  const {
    streamUrl,
    onEvent,
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
  const listeners = new Map<string, (event: { data: string }) => void>()

  const setMode = (next: LiveFeedMode) => {
    mode = next
    onModeChange?.(next)
  }

  const dispatch = (event: LiveStreamClientEvent) => {
    onEvent?.(event)
    if (!onEvent) onInvalidate?.()
  }

  const startPoll = () => {
    if (pollTimer) return
    setMode('poll')
    pollTimer = setInterval(() => {
      onInvalidate?.()
    }, pollIntervalMs)
  }

  const bindEvent = (type: string) => {
    const handler = (raw: { data: string }) => {
      const parsed = parseClientEvent(type, raw.data)
      if (parsed) dispatch(parsed)
      else onInvalidate?.()
    }
    listeners.set(type, handler)
    source?.addEventListener(type, handler)
  }

  const start = () => {
    if (stopped) return

    if (!canUseSse) {
      startPoll()
      return
    }

    setMode('sse')
    source = eventSourceFactory(streamUrl)
    for (const type of ['chat:message', 'lattice:state', 'message'] as const) {
      bindEvent(type)
    }
    source.addEventListener('heartbeat', () => {
      // keep-alive only
    })
    source.onerror = () => {
      for (const [type, handler] of listeners) {
        source?.removeEventListener(type, handler)
      }
      listeners.clear()
      source?.close()
      source = null
      onInvalidate?.()
      startPoll()
    }
  }

  const stop = () => {
    stopped = true
    if (source) {
      for (const [type, handler] of listeners) {
        source.removeEventListener(type, handler)
      }
      listeners.clear()
      source.close()
      source = null
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

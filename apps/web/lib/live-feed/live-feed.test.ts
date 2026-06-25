import { afterEach, describe, expect, it } from 'bun:test'

import { isChatSseEnabled } from '@/lib/live-chat-sync-policy'
import { createLiveFeed, DEFAULT_POLL_INTERVAL_MS, resolveLiveFeedMode } from './live-feed'

const envSnapshot = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_ENABLE_CHAT_SSE: process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE,
}

afterEach(() => {
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('resolveLiveFeedMode', () => {
  it('matches chat SSE policy', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE
    expect(resolveLiveFeedMode()).toBe(isChatSseEnabled() ? 'sse' : 'poll')
  })
})

describe('createLiveFeed', () => {
  it('polls when SSE is disabled', () => {
    const invalidations: number[] = []
    const feed = createLiveFeed({
      streamUrl: 'http://localhost:8080/api/chat/stream',
      onInvalidate: () => invalidations.push(Date.now()),
      preferSse: false,
      pollIntervalMs: 50,
    })

    feed.start()
    expect(feed.getMode()).toBe('poll')

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        feed.stop()
        expect(invalidations.length).toBeGreaterThan(0)
        resolve()
      }, 120)
    })
  })

  it('falls back to poll when EventSource errors', () => {
    const invalidations: number[] = []
    let errorHandler: (() => void) | null = null

    const feed = createLiveFeed({
      streamUrl: 'http://localhost:8080/api/chat/stream',
      onInvalidate: () => invalidations.push(1),
      preferSse: true,
      pollIntervalMs: 50,
      eventSourceFactory: () => ({
        addEventListener: () => {},
        removeEventListener: () => {},
        close: () => {},
        get onerror() {
          return errorHandler
        },
        set onerror(handler) {
          errorHandler = handler as () => void
        },
      }),
    })

    feed.start()
    expect(feed.getMode()).toBe('sse')
    errorHandler?.()
    expect(invalidations.length).toBe(1)

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(feed.getMode()).toBe('poll')
        feed.stop()
        resolve()
      }, 80)
    })
  })

  it('routes multiplex SSE events', () => {
    const events: string[] = []
    const handlers = new Map<string, (event: { data: string }) => void>()
    const feed = createLiveFeed({
      streamUrl: 'http://localhost:8080/api/live/stream',
      onEvent: (event) => events.push(event.type),
      preferSse: true,
      eventSourceFactory: () => ({
        addEventListener: (type, listener) => {
          handlers.set(type, listener)
        },
        removeEventListener: (type) => {
          handlers.delete(type)
        },
        close: () => {},
        onerror: null,
      }),
    })

    feed.start()
    handlers.get('lattice:state')?.({ data: JSON.stringify({ now: '2026-01-01' }) })
    handlers.get('chat:message')?.({ data: JSON.stringify({ messageId: 'm1' }) })
    feed.stop()

    expect(events).toEqual(['lattice:state', 'chat:message'])
  })

  it('uses default poll interval constant', () => {
    expect(DEFAULT_POLL_INTERVAL_MS).toBe(2_000)
  })
})

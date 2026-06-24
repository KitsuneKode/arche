import { afterEach, describe, expect, it } from 'bun:test'

import { isChatSseEnabled } from './live-chat-sync-policy'

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

describe('live-chat-sync policy', () => {
  it('disables SSE in production by default', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE
    expect(isChatSseEnabled()).toBe(false)
  })

  it('allows explicit SSE override in production', () => {
    process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE = 'true'
    expect(isChatSseEnabled()).toBe(true)
  })
})

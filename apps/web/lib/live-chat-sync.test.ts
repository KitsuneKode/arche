import { afterEach, describe, expect, it } from 'bun:test'

import { isChatSseEnabled } from './live-chat-sync-policy'

const envSnapshot = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_ENABLE_CHAT_SSE: process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE,
  API_UPSTREAM_URL: process.env.API_UPSTREAM_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

afterEach(() => {
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('live-chat-sync policy', () => {
  it('disables SSE in cross-origin production', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE
    delete process.env.API_UPSTREAM_URL
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
    expect(isChatSseEnabled()).toBe(false)
  })

  it('enables SSE in production with same-origin public URLs', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE
    delete process.env.API_UPSTREAM_URL
    process.env.NEXT_PUBLIC_API_URL = 'https://app.example.com/'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
    expect(isChatSseEnabled()).toBe(true)
  })

  it('enables SSE in production when API_UPSTREAM_URL is set', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE
    process.env.API_UPSTREAM_URL = 'https://api.example.com'
    expect(isChatSseEnabled()).toBe(true)
  })

  it('allows explicit SSE override in production', () => {
    process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE = 'true'
    expect(isChatSseEnabled()).toBe(true)
  })

  it('allows explicit SSE disable', () => {
    process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE = 'false'
    process.env.API_UPSTREAM_URL = 'https://api.example.com'
    expect(isChatSseEnabled()).toBe(false)
  })
})

import { describe, expect, it } from 'bun:test'

process.env.CI = 'true'
process.env.NEXT_PUBLIC_SITE_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_APP_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_API_URL = 'https://api.arche.kitsunelabs.xyz'

const { fetchApiHealth, probeApiHealth } = await import('@/lib/api-health')

describe('probeApiHealth', () => {
  it('returns reachable status with latency when database is connected', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ database: 'connected', status: 'OK' }), {
        status: 200,
      })) as typeof fetch

    await expect(probeApiHealth()).resolves.toEqual(
      expect.objectContaining({ reachable: true, database: 'connected' }),
    )
    globalThis.fetch = originalFetch
  })

  it('returns unreachable when health request fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      throw new Error('network')
    }) as typeof fetch

    await expect(probeApiHealth()).resolves.toEqual(expect.objectContaining({ reachable: false }))
    globalThis.fetch = originalFetch
  })

  it('returns unreachable when schema migrations are pending', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ database: 'connected', status: 'OK', schema: 'pending' }), {
        status: 503,
      })) as typeof fetch

    await expect(probeApiHealth()).resolves.toEqual(
      expect.objectContaining({ reachable: false, database: 'connected', schema: 'pending' }),
    )
    globalThis.fetch = originalFetch
  })
})

describe('fetchApiHealth', () => {
  it('returns true when health responds with connected database', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ database: 'connected' }), { status: 200 })) as typeof fetch

    await expect(fetchApiHealth()).resolves.toBe(true)
    globalThis.fetch = originalFetch
  })

  it('returns false when health request fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      throw new Error('network')
    }) as typeof fetch

    await expect(fetchApiHealth()).resolves.toBe(false)
    globalThis.fetch = originalFetch
  })

  it('returns false when database is not connected', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ database: 'disconnected' }), { status: 200 })) as typeof fetch

    await expect(fetchApiHealth()).resolves.toBe(false)
    globalThis.fetch = originalFetch
  })
})

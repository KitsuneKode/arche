import { describe, expect, it } from 'bun:test'

process.env.CI = 'true'
process.env.NEXT_PUBLIC_SITE_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_APP_URL = 'https://arche.kitsunelabs.xyz'
process.env.NEXT_PUBLIC_API_URL = 'https://arche.kitsunelabs.xyz'
process.env.API_UPSTREAM_URL = 'https://api.arche.kitsunelabs.xyz'

const { apiPath, getClientApiOrigin, getServerApiOrigin, usesSameOriginApiProxy } =
  await import('@/lib/api-origin')

describe('api-origin', () => {
  it('detects same-origin proxy when API URL matches app URL', () => {
    expect(usesSameOriginApiProxy()).toBe(true)
    expect(getClientApiOrigin()).toBe('')
    expect(apiPath('/api/trpc', true)).toBe('/api/trpc')
    expect(apiPath('/health', true)).toBe('/health')
  })

  it('uses API_UPSTREAM_URL for server-side paths', () => {
    expect(getServerApiOrigin()).toBe('https://api.arche.kitsunelabs.xyz')
    expect(apiPath('/health', false)).toBe('https://api.arche.kitsunelabs.xyz/health')
    expect(apiPath('/api/trpc', false)).toBe('https://api.arche.kitsunelabs.xyz/api/trpc')
  })
})

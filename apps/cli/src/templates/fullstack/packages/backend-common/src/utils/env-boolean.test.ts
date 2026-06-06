import { afterEach, describe, expect, it } from 'bun:test'

import { envBoolean } from './env-boolean'

describe('envBoolean', () => {
  afterEach(() => {
    delete process.env.RENDER
    delete process.env.VERCEL
  })

  it('parses false-like strings as false', () => {
    expect(envBoolean('false', true)).toBe(false)
    expect(envBoolean('0', true)).toBe(false)
    expect(envBoolean('no', true)).toBe(false)
    expect(envBoolean('off', true)).toBe(false)
    expect(envBoolean('', true)).toBe(false)
  })

  it('parses true-like strings as true', () => {
    expect(envBoolean('true', false)).toBe(true)
    expect(envBoolean('1', false)).toBe(true)
    expect(envBoolean('yes', false)).toBe(true)
    expect(envBoolean('on', false)).toBe(true)
  })

  it('uses default when value is undefined', () => {
    expect(envBoolean(undefined, true)).toBe(true)
    expect(envBoolean(undefined, false)).toBe(false)
  })

  it('does not treat string "false" as truthy', () => {
    expect(!!envBoolean('false', true)).toBe(false)
  })
})

describe('isRedisEnabled with RENDER skipValidation', () => {
  const baseEnv = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    BETTER_AUTH_SECRET: 'local-dev-only-not-a-real-better-auth-secret',
    BETTER_AUTH_URL: 'http://localhost:8080',
    FRONTEND_URL: 'http://localhost:3000',
    ENABLE_REDIS: 'false',
  }

  afterEach(() => {
    for (const key of Object.keys(baseEnv)) {
      delete process.env[key]
    }
    delete process.env.RENDER
    delete process.env.VERCEL
    delete process.env.CI
  })

  async function loadIsRedisEnabled(): Promise<boolean> {
    const { isRedisEnabled } = await import('./redis-enabled')
    return isRedisEnabled()
  }

  it('returns false when RENDER=true and ENABLE_REDIS=false', async () => {
    Object.assign(process.env, baseEnv)
    process.env.RENDER = 'true'

    expect(await loadIsRedisEnabled()).toBe(false)
  })

  it('returns false when VERCEL=1 and ENABLE_REDIS=false', async () => {
    Object.assign(process.env, baseEnv)
    process.env.VERCEL = '1'

    expect(await loadIsRedisEnabled()).toBe(false)
  })
})

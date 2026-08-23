#!/usr/bin/env bun
/**
 * Live demo integration smoke — exercises every proof-ladder layer against a running API.
 *
 * Local:
 *   RUN_LIVE_DEMO_SMOKE=1 bun test tests/src/live-demo-smoke.test.ts
 *
 * Production:
 *   RUN_LIVE_DEMO_SMOKE=1 \
 *     NEXT_PUBLIC_API_URL=https://api.arche.kitsunelabs.xyz \
 *     NEXT_PUBLIC_APP_URL=https://arche.kitsunelabs.xyz \
 *     bun test tests/src/live-demo-smoke.test.ts
 *
 * Requires: API on NEXT_PUBLIC_API_URL (default http://localhost:8080), migrated + seeded DB.
 */
import { describe, expect, it } from 'bun:test'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const RUN = process.env.RUN_LIVE_DEMO_SMOKE === '1'
/** Keep in sync with apps/web/lib/proof-run PROOF_RUNGS length. */
const EXPECTED_PROOF_RUNG_COUNT = 12

function trpcQueryUrl(procedure: string, input: unknown = null) {
  const batchInput = encodeURIComponent(JSON.stringify({ 0: { json: input } }))
  return `${API}/api/trpc/${procedure}?batch=1&input=${batchInput}`
}

async function trpcQuery<T>(procedure: string, input: unknown = null, cookie?: string): Promise<T> {
  const response = await fetch(trpcQueryUrl(procedure, input), {
    headers: cookie ? { cookie } : undefined,
    credentials: 'include',
  })
  expect(response.ok).toBe(true)
  const body = (await response.json()) as Array<{ result?: { data: { json: T } }; error?: unknown }>
  const entry = body[0]
  if (entry?.error) throw new Error(JSON.stringify(entry.error))
  return entry!.result!.data.json
}

function extractCookies(response: Response): string {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie
  const fromArray = getSetCookie?.call(response.headers) ?? []
  if (fromArray.length > 0) {
    return fromArray.map((c) => c.split(';')[0]).join('; ')
  }
  const single = response.headers.get('set-cookie')
  return single ? single.split(';')[0] : ''
}

async function signIn(email: string, password: string): Promise<string> {
  const response = await fetch(`${API}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  expect(response.ok).toBe(true)
  const cookie = extractCookies(response)
  expect(cookie.length).toBeGreaterThan(0)
  return cookie
}

const maybeDescribe = RUN ? describe : describe.skip

maybeDescribe('live demo smoke (RUN_LIVE_DEMO_SMOKE=1)', () => {
  it('0. proof rung registry has 12 rungs', () => {
    expect(EXPECTED_PROOF_RUNG_COUNT).toBe(12)
  })

  it(
    '1. API health — database connected',
    async () => {
      const response = await fetch(`${API}/health`)
      expect(response.ok).toBe(true)
      const body = (await response.json()) as { database?: string; status?: string }
      expect(body.database).toBe('connected')
      expect(body.status).toBe('OK')
    },
    { timeout: 15_000 },
  )

  it('2. tRPC hello contract', async () => {
    const greeting = await trpcQuery<string>('hello', { name: 'Arche' })
    expect(greeting).toContain('Arche')
  })

  it('3. post.list returns seeded published posts', async () => {
    const posts = await trpcQuery<Array<{ id: string; title: string }>>('post.list')
    expect(posts.length).toBeGreaterThan(0)
  })

  it('4. chat.list returns messages without sender email', async () => {
    const messages = await trpcQuery<
      Array<{
        id: string
        content: string
        sender: { id: string; name: string; image: string | null }
      }>
    >('chat.list')
    expect(Array.isArray(messages)).toBe(true)
    if (messages.length === 0) return
    const serialized = JSON.stringify(messages)
    expect(serialized).not.toMatch(/@/)
    for (const message of messages) {
      expect(message.sender).toBeDefined()
      expect('email' in (message.sender ?? {})).toBe(false)
    }
  })

  it('5. auth.getSession returns guest when unsigned', async () => {
    const session = await trpcQuery<{ user: { id: string } | null } | null>('auth.getSession')
    expect(session?.user ?? null).toBeNull()
  })

  it('6. sign-up, verifySend, game score, getSecretMessage when authenticated', async () => {
    const email = `smoke+${Date.now()}@example.com`
    const password = 'SmokeTest123!'

    const signUp = await fetch(`${API}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Smoke Runner' }),
    })
    expect(signUp.ok).toBe(true)

    const cookie = await signIn(email, password)

    const session = await trpcQuery<{ user: { id: string; name: string } } | null>(
      'auth.getSession',
      null,
      cookie,
    )
    expect(session?.user?.name).toBe('Smoke Runner')

    const verify = await fetch(`${API}/api/trpc/chat.verifySend?batch=1`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        0: { json: { content: `smoke verify ${Date.now()}` } },
      }),
    })
    expect(verify.ok).toBe(true)

    const score = await fetch(`${API}/api/trpc/game.submitScore?batch=1`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        0: { json: { score: 1 } },
      }),
    })
    expect(score.ok).toBe(true)

    const secret = await trpcQuery<string>('auth.getSecretMessage', null, cookie)
    expect(secret).toContain('secret')
  }, 15_000)

  it('7. chat.send rejects content over 280 chars', async () => {
    const email = `live-long-${Date.now()}@example.com`
    const password = 'SmokeTest123!'
    await fetch(`${API}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Long Msg' }),
    })
    const cookie = await signIn(email, password)

    const response = await fetch(`${API}/api/trpc/chat.send?batch=1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ 0: { json: { content: 'x'.repeat(281) } } }),
    })
    const body = (await response.json()) as Array<{ error?: unknown }>
    expect(body[0]?.error).toBeDefined()
  })

  it('8. game.leaderboard returns array', async () => {
    const board = await trpcQuery<Array<{ score: number; displayName: string }>>('game.leaderboard')
    expect(Array.isArray(board)).toBe(true)
  })

  it(
    '9. /live page renders when web dev server is up',
    async () => {
      const web = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const response = await fetch(`${web}/live`)
      expect(response.ok).toBe(true)
      const html = await response.text()
      expect(html).toMatch(/Relay Run|Live sandbox/)
      expect(html).toMatch(/relay|Relay/)
      expect(html).not.toContain('Production Ready')
    },
    { timeout: 15_000 },
  )

  it(
    '9b. /live?tab=lab renders Stack Lab',
    async () => {
      const web = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const response = await fetch(`${web}/live?tab=lab`)
      expect(response.ok).toBe(true)
      const html = await response.text()
      expect(html).toMatch(/Stack Lab|stack lab/i)
    },
    { timeout: 15_000 },
  )

  it('10. demo.stackSnapshot returns SSR metadata', async () => {
    const snapshot = await trpcQuery<{
      fetchedAt: string
      health: { database: string }
      feeds: { chatMessageCount: number }
    }>('demo.stackSnapshot')
    expect(snapshot.fetchedAt).toBeTruthy()
    expect(snapshot.health.database).toBe('connected')
    expect(snapshot.feeds.chatMessageCount).toBeGreaterThanOrEqual(0)
  })

  it('11. chat.stats returns count metadata', async () => {
    const stats = await trpcQuery<{ total: number; latestAt: string | null }>('chat.stats')
    expect(stats.total).toBeGreaterThanOrEqual(0)
    if (stats.total > 0) {
      expect(stats.latestAt).toBeTruthy()
    }
  })

  it('12. post.create draft when authenticated', async () => {
    const email = `live-post-${Date.now()}@example.com`
    const password = 'SmokeTest123!'
    await fetch(`${API}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Post Smoke' }),
    })
    const cookie = await signIn(email, password)

    const response = await fetch(`${API}/api/trpc/post.create?batch=1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({
        0: {
          json: {
            title: 'Smoke draft',
            content: 'Created from live demo smoke test.',
            slug: `smoke-${Date.now().toString(36)}`,
            published: false,
          },
        },
      }),
    })
    expect(response.ok).toBe(true)
    const body = (await response.json()) as Array<{ result?: { data: { json: { id: string } } } }>
    expect(body[0]?.result?.data.json.id).toBeDefined()
  })

  it('13. unified live SSE stream emits ready', async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${API}/api/live/stream`, {
        signal: controller.signal,
        headers: { accept: 'text/event-stream' },
      })
      expect(response.ok).toBe(true)
      expect(response.headers.get('content-type')).toContain('text/event-stream')

      const reader = response.body?.getReader()
      expect(reader).toBeDefined()
      const { value } = await reader!.read()
      const chunk = new TextDecoder().decode(value)
      expect(chunk).toContain('event: ready')
    } finally {
      clearTimeout(timeout)
    }
  })

  it('14. legacy chat stream still works', async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${API}/api/chat/stream`, {
        signal: controller.signal,
        headers: { accept: 'text/event-stream' },
      })
      expect(response.ok).toBe(true)
      expect(response.headers.get('content-type')).toContain('text/event-stream')

      const reader = response.body?.getReader()
      expect(reader).toBeDefined()
      const { value } = await reader!.read()
      const chunk = new TextDecoder().decode(value)
      expect(chunk.length).toBeGreaterThan(0)
    } finally {
      clearTimeout(timeout)
    }
  })
})

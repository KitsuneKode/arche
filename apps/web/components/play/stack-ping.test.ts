import { describe, expect, it } from 'bun:test'

import { appendPing, bestPingMs } from '@/lib/stack-ping'

describe('stack-ping', () => {
  it('appendPing keeps newest first and limits history', () => {
    const first = appendPing([], { ms: 120, at: '2026-01-01T00:00:00.000Z' })
    const second = appendPing(first, { ms: 80, at: '2026-01-01T00:00:01.000Z' }, 2)
    const third = appendPing(second, { ms: 50, at: '2026-01-01T00:00:02.000Z' }, 2)

    expect(third).toEqual([
      { ms: 50, at: '2026-01-01T00:00:02.000Z' },
      { ms: 80, at: '2026-01-01T00:00:01.000Z' },
    ])
  })

  it('bestPingMs returns the minimum latency', () => {
    expect(
      bestPingMs([
        { ms: 200, at: 'a' },
        { ms: 45, at: 'b' },
        { ms: 90, at: 'c' },
      ]),
    ).toBe(45)
    expect(bestPingMs([])).toBeNull()
  })
})

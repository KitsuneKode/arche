import { describe, expect, it } from 'bun:test'

import { formatRelativeTime, formatUtcClockTime } from './client-mounted'

describe('client-mounted time helpers', () => {
  it('formatUtcClockTime is stable for the same instant', () => {
    const iso = '2026-06-24T19:48:58.000Z'
    expect(formatUtcClockTime(iso)).toBe('19:48:58')
    expect(formatUtcClockTime(new Date(iso))).toBe('19:48:58')
  })

  it('formatRelativeTime uses a fixed now argument', () => {
    const iso = '2026-06-24T19:40:00.000Z'
    const now = new Date('2026-06-24T19:48:00.000Z').getTime()
    expect(formatRelativeTime(iso, now)).toBe('8m ago')
  })
})

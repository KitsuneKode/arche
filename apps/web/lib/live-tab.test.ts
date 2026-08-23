import { describe, expect, it } from 'bun:test'

import { liveTabLabel, parseLiveTab } from '@/lib/live-tab'

describe('parseLiveTab', () => {
  it('defaults to play', () => {
    expect(parseLiveTab(null)).toBe('play')
    expect(parseLiveTab('')).toBe('play')
    expect(parseLiveTab('invalid')).toBe('play')
  })

  it('parses lab and room', () => {
    expect(parseLiveTab('lab')).toBe('lab')
    expect(parseLiveTab('room')).toBe('room')
    expect(parseLiveTab('play')).toBe('play')
  })
})

describe('liveTabLabel', () => {
  it('returns human labels', () => {
    expect(liveTabLabel('play')).toBe('Play')
    expect(liveTabLabel('lab')).toBe('Stack Lab')
    expect(liveTabLabel('room')).toBe('Room')
  })
})

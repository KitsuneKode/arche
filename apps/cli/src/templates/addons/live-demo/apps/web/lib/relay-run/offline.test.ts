import { afterEach, describe, expect, it } from 'bun:test'

import {
  clearPendingScore,
  readCachedLeaderboard,
  readPendingScore,
  writeCachedLeaderboard,
  writePendingScore,
} from './offline'

const storage = new Map<string, string>()

afterEach(() => {
  storage.clear()
})

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
})

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  writable: true,
  value: globalThis,
})

describe('relay-run offline cache', () => {
  it('stores and reads leaderboard cache', () => {
    writeCachedLeaderboard([
      {
        rank: 1,
        userId: 'u1',
        score: 12,
        displayName: 'Player',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    expect(readCachedLeaderboard()).toHaveLength(1)
    expect(readCachedLeaderboard()[0]?.score).toBe(12)
  })

  it('keeps only the highest pending score', () => {
    writePendingScore(4)
    writePendingScore(9)
    writePendingScore(6)
    expect(readPendingScore()).toBe(9)
    clearPendingScore()
    expect(readPendingScore()).toBeNull()
  })
})

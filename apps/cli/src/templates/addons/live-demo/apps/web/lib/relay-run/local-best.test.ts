import { afterEach, describe, expect, it } from 'bun:test'

import { readLocalBest, writeLocalBest } from './local-best'

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

describe('relay-run local-best', () => {
  it('returns 0 when no best is stored', () => {
    expect(readLocalBest()).toBe(0)
  })

  it('stores and updates higher score', () => {
    writeLocalBest(12)
    expect(readLocalBest()).toBe(12)

    writeLocalBest(15)
    expect(readLocalBest()).toBe(15)
  })

  it('does not overwrite with a lower score', () => {
    writeLocalBest(20)
    writeLocalBest(10)
    expect(readLocalBest()).toBe(20)
  })

  it('handles invalid stored values gracefully', () => {
    storage.set('relay-run-local-best', 'invalid-number')
    expect(readLocalBest()).toBe(0)
  })
})

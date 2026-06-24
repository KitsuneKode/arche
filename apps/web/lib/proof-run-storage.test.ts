import { describe, expect, it } from 'bun:test'

import { readProofRunProgress, writeProofRunProgress } from './proof-run-storage'

describe('proof-run-storage', () => {
  it('round-trips completed rung ids', () => {
    const storage = new Map<string, string>()
    const originalWindow = globalThis.window
    const mockLocalStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
    }

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: mockLocalStorage },
    })

    try {
      writeProofRunProgress(['api', 'contract'])
      expect(readProofRunProgress()).toEqual(['api', 'contract'])
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      })
    }
  })

  it('returns an empty list for invalid stored JSON', () => {
    const storage = new Map<string, string>([['arche:proof-run:v1', '{not-json']])
    const originalWindow = globalThis.window

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => storage.get(key) ?? null,
          setItem: (key: string, value: string) => {
            storage.set(key, value)
          },
        },
      },
    })

    try {
      expect(readProofRunProgress()).toEqual([])
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      })
    }
  })
})

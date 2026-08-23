import { afterEach, describe, expect, it } from 'bun:test'

import { createRelayRunAudio, readAudioMuted } from './audio'

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

describe('relay-run audio', () => {
  it('persists mute preference', () => {
    const audio = createRelayRunAudio()
    expect(audio.isMuted()).toBe(false)
    audio.setMuted(true)
    expect(readAudioMuted()).toBe(true)
    expect(createRelayRunAudio().isMuted()).toBe(true)
  })

  it('toggles mute state', () => {
    const audio = createRelayRunAudio()
    expect(audio.toggleMuted()).toBe(true)
    expect(audio.toggleMuted()).toBe(false)
  })
})

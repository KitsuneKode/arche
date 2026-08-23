import { describe, expect, it } from 'bun:test'

import { matchGameShortcut, shouldIgnoreGameKey } from './keyboard'

describe('relay-run keyboard', () => {
  it('ignores keys when typing in an input', () => {
    const input = { tagName: 'INPUT', isContentEditable: false } as HTMLElement
    const event = { target: input, key: 'f', code: 'KeyF' } as KeyboardEvent
    expect(shouldIgnoreGameKey(event)).toBe(true)
    expect(matchGameShortcut(event)).toBeNull()
  })

  it('allows keys when target is the game canvas', () => {
    const canvas = { tagName: 'CANVAS', isContentEditable: false } as HTMLElement
    const event = { target: canvas, key: 'f', code: 'KeyF' } as KeyboardEvent
    expect(shouldIgnoreGameKey(event)).toBe(false)
    expect(matchGameShortcut(event)).toBe('fullscreen')
  })

  it('maps gameplay and utility shortcuts', () => {
    const canvas = { tagName: 'CANVAS', isContentEditable: false } as HTMLElement

    expect(
      matchGameShortcut({
        target: canvas,
        key: ' ',
        code: 'Space',
      } as KeyboardEvent),
    ).toBe('flap')

    expect(
      matchGameShortcut({
        target: canvas,
        key: 'm',
        code: 'KeyM',
      } as KeyboardEvent),
    ).toBe('mute')

    expect(
      matchGameShortcut({
        target: canvas,
        key: 'p',
        code: 'KeyP',
      } as KeyboardEvent),
    ).toBe('pause')

    expect(
      matchGameShortcut({
        target: canvas,
        key: 'c',
        code: 'KeyC',
      } as KeyboardEvent),
    ).toBe('chat')
  })

  it('ignores shortcuts with modifier keys', () => {
    const canvas = { tagName: 'CANVAS', isContentEditable: false } as HTMLElement
    expect(
      matchGameShortcut({
        target: canvas,
        key: 'f',
        code: 'KeyF',
        ctrlKey: true,
      } as KeyboardEvent),
    ).toBeNull()
  })
})

export type GameShortcut = 'flap' | 'fullscreen' | 'mute' | 'pause' | 'chat'

export function shouldIgnoreGameKey(event: KeyboardEvent): boolean {
  const target = event.target
  if (target === null || typeof target !== 'object') return false

  if ('isContentEditable' in target && Boolean(target.isContentEditable)) return true

  if ('tagName' in target && typeof target.tagName === 'string') {
    const tag = target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
  }

  return false
}

export function matchGameShortcut(event: KeyboardEvent): GameShortcut | null {
  if (shouldIgnoreGameKey(event)) return null
  if (event.metaKey || event.ctrlKey || event.altKey) return null

  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'Enter') {
    return 'flap'
  }

  const key = event.key.toLowerCase()
  if (key === 'f') return 'fullscreen'
  if (key === 'm') return 'mute'
  if (key === 'p') return 'pause'
  if (key === 'c') return 'chat'

  return null
}

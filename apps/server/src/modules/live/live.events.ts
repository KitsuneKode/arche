import { EventEmitter } from 'node:events'

import type { LiveStreamEvent } from './live.dto'

const liveBus = new EventEmitter()
liveBus.setMaxListeners(500)

export function emitLiveEvent(event: LiveStreamEvent) {
  liveBus.emit('live', event)
}

export function emitGameLeaderboardUpdate() {
  emitLiveEvent({ type: 'game:leaderboard' })
}

export function subscribeLiveEvents(listener: (event: LiveStreamEvent) => void) {
  liveBus.on('live', listener)
  return () => {
    liveBus.off('live', listener)
  }
}

import type { PublicChatMessage } from '../live/live.dto'
import { emitLiveEvent, subscribeLiveEvents } from '../live/live.events'

export type ChatStreamEvent = {
  type: 'message'
  message: PublicChatMessage
}

export function emitChatMessage(message: PublicChatMessage) {
  emitLiveEvent({ type: 'chat:message', message })
}

export function subscribeChatEvents(listener: (event: ChatStreamEvent) => void) {
  return subscribeLiveEvents((event) => {
    if (event.type === 'chat:message') {
      listener({ type: 'message', message: event.message })
    }
  })
}

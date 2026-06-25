import { emitLiveEvent, subscribeLiveEvents } from '../live/live.events.js'

export type ChatStreamEvent = {
  type: 'message'
  messageId: string
}

export function emitChatMessage(messageId: string) {
  emitLiveEvent({ type: 'chat:message', messageId })
}

export function subscribeChatEvents(listener: (event: ChatStreamEvent) => void) {
  return subscribeLiveEvents((event) => {
    if (event.type === 'chat:message') {
      listener({ type: 'message', messageId: event.messageId })
    }
  })
}

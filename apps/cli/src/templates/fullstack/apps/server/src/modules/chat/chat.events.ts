import { EventEmitter } from 'node:events'

export type ChatStreamEvent = {
  type: 'message'
  messageId: string
}

const chatBus = new EventEmitter()
chatBus.setMaxListeners(200)

export function emitChatMessage(messageId: string) {
  const payload: ChatStreamEvent = { type: 'message', messageId }
  chatBus.emit('message', payload)
}

export function subscribeChatEvents(listener: (event: ChatStreamEvent) => void) {
  chatBus.on('message', listener)
  return () => {
    chatBus.off('message', listener)
  }
}

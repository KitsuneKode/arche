import { toPublicMessage } from '../common/public-dto.js'
import { SYSTEM_USER_ID } from '../lattice/lattice.deck.js'
import { emitChatMessage } from './chat.events.js'
import { chatRepository } from './chat.repository.js'

export const chatService = {
  async listMessages() {
    const messages = await chatRepository.findRecentMessages()
    return messages.map(toPublicMessage)
  },

  async getStats() {
    return chatRepository.getStats()
  },

  async sendMessage(senderId: string, content: string) {
    const message = await chatRepository.createMessage({ content, senderId, kind: 'user' })
    emitChatMessage(message.id)
    return toPublicMessage(message)
  },

  async verifySend(senderId: string, content: string) {
    if (!content.trim() || content.length > 280) {
      throw new Error('Message must be 1–280 characters')
    }
    return { ok: true as const }
  },

  async postSystemMessage(content: string) {
    const message = await chatRepository.createMessage({
      content,
      senderId: SYSTEM_USER_ID,
      kind: 'system',
    })
    emitChatMessage(message.id)
    return toPublicMessage(message)
  },
}

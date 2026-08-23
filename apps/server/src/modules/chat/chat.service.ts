import { toPublicMessage } from '../common/public-dto'
import { SYSTEM_USER_ID } from '../lattice/lattice.deck'
import { emitChatMessage } from './chat.events'
import { assertCanSendMessage } from './chat.policy'
import { chatRepository } from './chat.repository'

export const chatService = {
  async listMessages() {
    const messages = await chatRepository.findRecentMessages()
    return messages.map(toPublicMessage)
  },

  async getStats() {
    return chatRepository.getStats()
  },

  async sendMessage(senderId: string, content: string) {
    await assertCanSendMessage(senderId, content)
    const message = await chatRepository.createMessage({ content, senderId, kind: 'user' })
    const publicMessage = toPublicMessage(message)
    emitChatMessage(publicMessage)
    return publicMessage
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
    const publicMessage = toPublicMessage(message)
    emitChatMessage(publicMessage)
    return publicMessage
  },
}

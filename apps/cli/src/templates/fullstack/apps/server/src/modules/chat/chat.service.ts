import { toPublicMessage } from '../common/public-dto.js'
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
    const message = await chatRepository.createMessage({ content, senderId })
    emitChatMessage(message.id)
    return toPublicMessage(message)
  },
}

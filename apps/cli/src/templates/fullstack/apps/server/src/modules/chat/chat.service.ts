import { chatRepository } from './chat.repository'

export const chatService = {
  listMessages() {
    return chatRepository.findRecentMessages()
  },

  sendMessage(senderId: string, content: string) {
    return chatRepository.createMessage({ content, senderId })
  },
}

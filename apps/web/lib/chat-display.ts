import { guestDisplayName, resolveDisplayName } from '@arche-template/auth/guest-display-name'

export type ChatMessageSender = {
  id: string
  name: string | null
  image?: string | null
} | null

export type ChatMessageRow = {
  id: string
  content: string
  kind?: string
  senderId: string
  createdAt: Date | string
  sender: ChatMessageSender
}

export function formatChatSenderLabel(
  message: Pick<ChatMessageRow, 'senderId' | 'sender'>,
  currentUserId?: string,
): string {
  if (currentUserId && message.senderId === currentUserId) {
    return 'You'
  }

  const sender = message.sender
  const resolved =
    sender?.name ??
    resolveDisplayName({
      id: message.senderId,
      name: sender?.name ?? null,
      isAnonymous: null,
    })

  return resolved ?? guestDisplayName(message.senderId)
}

type PublicUserShape = {
  id: string
  name: string | null
  image: string | null
}

type UserWithOptionalFields = {
  id: string
  name: string | null
  image: string | null
  email?: string | null
  emailVerified?: boolean | null
}

export function toPublicUser(user: UserWithOptionalFields | null): PublicUserShape | null {
  if (!user) return null
  return { id: user.id, name: user.name, image: user.image }
}

type MessageWithSender = {
  id: string
  content: string
  senderId: string
  createdAt: Date
  sender: UserWithOptionalFields | null
}

export function toPublicMessage(message: MessageWithSender) {
  return {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    createdAt: message.createdAt,
    sender: toPublicUser(message.sender),
  }
}

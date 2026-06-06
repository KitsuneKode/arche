import { prisma } from '../../db/index.js'

export const chatRepository = {
  findRecentMessages() {
    return prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: { sender: true },
    })
  },

  createMessage(data: { content: string; senderId: string }) {
    return prisma.message.create({
      data,
      include: { sender: true },
    })
  },
}

import { prisma } from '../../db/index.js'

export const chatRepository = {
  findRecentMessages() {
    return prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: { sender: true },
    })
  },

  createMessage(data: { content: string; senderId: string; kind?: string }) {
    return prisma.message.create({
      data: {
        content: data.content,
        senderId: data.senderId,
        kind: data.kind ?? 'user',
      },
      include: { sender: true },
    })
  },

  async getStats() {
    const [total, latest] = await Promise.all([
      prisma.message.count(),
      prisma.message.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ])
    return {
      total,
      latestAt: latest?.createdAt?.toISOString() ?? null,
    }
  },
}

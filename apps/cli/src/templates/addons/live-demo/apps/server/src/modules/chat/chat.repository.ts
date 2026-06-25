import { prisma } from '../../db/index.js'

export function buildPublicFeedWhere() {
  return {
    kind: { notIn: ['proof'] },
    NOT: {
      sender: {
        OR: [{ name: 'Live Smoke' }, { email: { startsWith: 'smoke+' } }],
      },
    },
  }
}

export const chatRepository = {
  findRecentMessages() {
    return prisma.message.findMany({
      where: buildPublicFeedWhere(),
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
    const where = buildPublicFeedWhere()
    const [total, latest] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findFirst({
        where,
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

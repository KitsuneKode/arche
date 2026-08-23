import { prisma } from '../../db/index'

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

const PUBLIC_FEED_LIMIT = 100

export const chatRepository = {
  findRecentMessages() {
    return prisma.message.findMany({
      where: buildPublicFeedWhere(),
      orderBy: { createdAt: 'asc' },
      take: PUBLIC_FEED_LIMIT,
      include: { sender: true },
    })
  },

  findById(id: string) {
    return prisma.message.findFirst({
      where: { id, ...buildPublicFeedWhere() },
      include: { sender: true },
    })
  },

  countRecentBySender(senderId: string, since: Date) {
    return prisma.message.count({
      where: {
        senderId,
        kind: 'user',
        createdAt: { gte: since },
      },
    })
  },

  findLatestBySender(senderId: string) {
    return prisma.message.findFirst({
      where: { senderId, kind: 'user' },
      orderBy: { createdAt: 'desc' },
      select: { content: true, createdAt: true },
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

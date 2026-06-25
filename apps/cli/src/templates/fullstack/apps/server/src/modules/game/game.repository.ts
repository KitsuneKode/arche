import { prisma } from '../../db/index.js'

const LEADERBOARD_LIMIT = 10

export const gameRepository = {
  insertScore(userId: string, score: number) {
    return prisma.relayRunScore.create({
      data: { userId, score },
    })
  },

  findUserBest(userId: string) {
    return prisma.relayRunScore.findFirst({
      where: { userId },
      orderBy: { score: 'desc' },
    })
  },

  async findLeaderboard(limit = LEADERBOARD_LIMIT) {
    const grouped = await prisma.relayRunScore.groupBy({
      by: ['userId'],
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: limit,
    })
    if (!grouped.length) return []

    const userIds = grouped.map((entry) => entry.userId)
    const [users, scoreRows] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      }),
      prisma.relayRunScore.findMany({
        where: { userId: { in: userIds } },
        orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
        select: { userId: true, score: true, createdAt: true },
      }),
    ])

    const nameById = new Map(users.map((user) => [user.id, user.name]))
    const bestScoreByUser = new Map(grouped.map((entry) => [entry.userId, entry._max.score ?? 0]))
    const createdAtByUser = new Map<string, Date>()
    for (const row of scoreRows) {
      if (bestScoreByUser.get(row.userId) !== row.score) continue
      if (!createdAtByUser.has(row.userId)) createdAtByUser.set(row.userId, row.createdAt)
    }

    return grouped.map((entry) => ({
      userId: entry.userId,
      score: entry._max.score ?? 0,
      displayName: nameById.get(entry.userId) ?? 'Player',
      createdAt: createdAtByUser.get(entry.userId) ?? new Date(),
    }))
  },

  async countUsersWithBetterBest(score: number) {
    const grouped = await prisma.relayRunScore.groupBy({
      by: ['userId'],
      _max: { score: true },
    })
    return grouped.filter((entry) => (entry._max.score ?? 0) > score).length
  },

  findRecentByUser(userId: string, take = 5) {
    return prisma.relayRunScore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      select: { score: true, createdAt: true },
    })
  },
}

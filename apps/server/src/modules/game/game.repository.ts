import { guestDisplayName } from '@arche-template/auth/guest-display-name'
import { prisma } from '../../db/index.js'

const LEADERBOARD_LIMIT = 10

type LeaderboardRow = {
  userId: string
  score: number
  createdAt: Date
  displayName: string | null
  isAnonymous: boolean | null
}

type CountRow = {
  count: number
}

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
    const rows = await prisma.$queryRaw<LeaderboardRow[]>`
      SELECT
        best."userId",
        best.score,
        best."createdAt",
        best."displayName",
        best."isAnonymous"
      FROM (
        SELECT DISTINCT ON (s."userId")
          s."userId" AS "userId",
          s.score AS score,
          s."createdAt" AS "createdAt",
          u.name AS "displayName",
          u."isAnonymous" AS "isAnonymous"
        FROM relay_run_score s
        JOIN "user" u ON u.id = s."userId"
        ORDER BY s."userId", s.score DESC, s."createdAt" ASC
      ) best
      ORDER BY best.score DESC, best."createdAt" ASC
      LIMIT ${limit}
    `

    return rows.map((row) => ({
      userId: row.userId,
      score: row.score,
      displayName: row.isAnonymous ? guestDisplayName(row.userId) : (row.displayName ?? 'Player'),
      createdAt: row.createdAt,
    }))
  },

  async countUsersWithBetterBest(score: number) {
    const result = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT s."userId"
        FROM relay_run_score s
        GROUP BY s."userId"
        HAVING MAX(s.score) > ${score}
      ) t
    `
    return result[0]?.count ?? 0
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

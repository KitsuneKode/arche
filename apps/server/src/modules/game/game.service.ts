import { rankForBestScore } from './game.rank.js'
import { gameRepository } from './game.repository.js'

const SUBMIT_COOLDOWN_MS = 3_000
const MAX_SCORE_JUMP = 500

const lastSubmitByUser = new Map<string, number>()

export const gameService = {
  async submitScore(userId: string, score: number) {
    const now = Date.now()
    const last = lastSubmitByUser.get(userId) ?? 0
    if (now - last < SUBMIT_COOLDOWN_MS) {
      throw new Error('Please wait before submitting again')
    }

    const best = await gameRepository.findUserBest(userId)
    if (best && score < best.score) {
      throw new Error('Score must beat your personal best')
    }
    if (best && score - best.score > MAX_SCORE_JUMP) {
      throw new Error('Score increase too large')
    }

    const recent = await gameRepository.findRecentByUser(userId, 1)
    const lastRun = recent[0]
    if (lastRun && now - lastRun.createdAt.getTime() < SUBMIT_COOLDOWN_MS) {
      throw new Error('Please wait before submitting again')
    }

    const row = await gameRepository.insertScore(userId, score)
    lastSubmitByUser.set(userId, now)

    const usersAbove = await gameRepository.countUsersWithBetterBest(score)
    const rank = rankForBestScore(usersAbove)

    return {
      score: row.score,
      rank,
      personalBest: row.score,
    }
  },

  async leaderboard() {
    const rows = await gameRepository.findLeaderboard()
    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      score: row.score,
      displayName: row.displayName,
      createdAt: row.createdAt.toISOString(),
    }))
  },

  async myBest(userId: string) {
    const best = await gameRepository.findUserBest(userId)
    if (!best) return null
    return { score: best.score, createdAt: best.createdAt.toISOString() }
  },
}

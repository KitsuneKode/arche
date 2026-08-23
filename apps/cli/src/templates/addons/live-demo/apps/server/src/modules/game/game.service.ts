import { emitGameLeaderboardUpdate } from '../live/live.events'
import { rankForBestScore } from './game.rank'
import { gameRepository } from './game.repository'

const SUBMIT_COOLDOWN_MS = 3_000
const MAX_SCORE_JUMP = 500

export const gameService = {
  async submitScore(userId: string, score: number) {
    const now = Date.now()

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

    const usersAbove = await gameRepository.countUsersWithBetterBest(score)
    const rank = rankForBestScore(usersAbove)

    emitGameLeaderboardUpdate()

    return {
      score: row.score,
      rank,
      personalBest: row.score,
    }
  },

  /** Proof-run / contract check — validates auth + bounds without writing a score row. */
  verifyScore(userId: string, score: number) {
    void userId
    if (!Number.isInteger(score) || score < 0 || score > 9999) {
      throw new Error('Score must be an integer from 0 to 9999')
    }
    return { ok: true as const }
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

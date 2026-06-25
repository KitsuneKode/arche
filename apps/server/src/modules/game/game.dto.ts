import { z } from 'zod'

export const submitScoreSchema = z.object({
  score: z.number().int().min(0).max(9999),
})

export const leaderboardEntrySchema = z.object({
  rank: z.number().int(),
  score: z.number().int(),
  displayName: z.string(),
  createdAt: z.string(),
})

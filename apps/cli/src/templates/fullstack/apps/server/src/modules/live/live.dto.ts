import { z } from 'zod'

export const latticeCellPublicSchema = z.object({
  id: z.string(),
  label: z.string(),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
})

export const latticeRoundPublicSchema = z.object({
  id: z.string(),
  roundNumber: z.number(),
  status: z.enum(['open', 'resolved']),
  startsAt: z.string(),
  endsAt: z.string(),
  cellA: z.object({ id: z.string(), label: z.string() }),
  cellB: z.object({ id: z.string(), label: z.string() }),
  votesA: z.number(),
  votesB: z.number(),
  myVote: z.enum(['a', 'b']).nullable(),
  winnerId: z.string().nullable(),
})

export const latticeStatePublicSchema = z.object({
  now: z.string(),
  cells: z.array(latticeCellPublicSchema),
  round: latticeRoundPublicSchema.nullable(),
})

export type LatticeStatePublic = z.infer<typeof latticeStatePublicSchema>

export type LiveStreamEvent =
  | { type: 'chat:message'; messageId: string }
  | { type: 'lattice:state'; state: LatticeStatePublic }

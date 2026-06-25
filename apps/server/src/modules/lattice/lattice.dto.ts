import { z } from 'zod'

export const voteSchema = z.object({
  roundId: z.string().min(1),
  choice: z.enum(['a', 'b']),
})

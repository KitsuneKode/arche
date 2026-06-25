import type { TRPCRouterRecord } from '@trpc/server'

import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { voteSchema } from './lattice.dto.js'
import { latticeService } from './lattice.service.js'

export const latticeRouter = {
  getState: publicProcedure.query(({ ctx }) =>
    latticeService.getPublicState(ctx.session?.user?.id),
  ),

  vote: protectedProcedure
    .input(voteSchema)
    .mutation(({ ctx, input }) =>
      latticeService.castVote(ctx.session.user.id, input.roundId, input.choice),
    ),
} satisfies TRPCRouterRecord

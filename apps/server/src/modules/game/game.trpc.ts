import type { TRPCRouterRecord } from '@trpc/server'

import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { submitScoreSchema } from './game.dto.js'
import { gameService } from './game.service.js'

export const gameRouter = {
  leaderboard: publicProcedure.query(() => gameService.leaderboard()),

  myBest: protectedProcedure.query(({ ctx }) => gameService.myBest(ctx.session.user.id)),

  submitScore: protectedProcedure
    .input(submitScoreSchema)
    .mutation(({ ctx, input }) => gameService.submitScore(ctx.session.user.id, input.score)),
} satisfies TRPCRouterRecord

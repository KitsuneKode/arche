import type { TRPCRouterRecord } from '@trpc/server'

import { protectedProcedure, publicProcedure } from '../trpc/trpc'
import { submitScoreSchema } from './game.dto'
import { gameService } from './game.service'

export const gameRouter = {
  leaderboard: publicProcedure.query(() => gameService.leaderboard()),

  myBest: protectedProcedure.query(({ ctx }) => gameService.myBest(ctx.session.user.id)),

  verifyScore: protectedProcedure
    .input(submitScoreSchema)
    .mutation(({ ctx, input }) => gameService.verifyScore(ctx.session.user.id, input.score)),

  submitScore: protectedProcedure
    .input(submitScoreSchema)
    .mutation(({ ctx, input }) => gameService.submitScore(ctx.session.user.id, input.score)),
} satisfies TRPCRouterRecord

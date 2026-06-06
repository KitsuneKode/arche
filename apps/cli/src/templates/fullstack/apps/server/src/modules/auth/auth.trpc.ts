import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => ctx.session),

  getSecretMessage: protectedProcedure.query(() => 'you can see this secret message!'),
} satisfies TRPCRouterRecord

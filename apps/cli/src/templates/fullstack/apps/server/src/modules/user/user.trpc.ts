import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { createUserSchema } from './user.dto'
import { userService } from './user.service'

export const userRouter = {
  getUser: publicProcedure.query(() => userService.getDemoUser()),

  getAllUser: publicProcedure.query(() => userService.listAll()),

  createUser: protectedProcedure
    .input(createUserSchema)
    .mutation(async (opts) => userService.findByEmail(opts.input.email)),
} satisfies TRPCRouterRecord

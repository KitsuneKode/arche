import type { TRPCRouterRecord } from '@trpc/server'
import { TRPCError } from '@trpc/server'
import { toPublicUser } from '../common/public-dto.js'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { findUserByEmailSchema } from './user.dto'
import { userService } from './user.service'

export const userRouter = {
  getUser: publicProcedure.query(() => userService.getDemoUser()),

  findUserByEmail: protectedProcedure.input(findUserByEmailSchema).query(async ({ ctx, input }) => {
    const sessionEmail = ctx.session.user.email
    if (!sessionEmail || input.email !== sessionEmail) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only look up your own email',
      })
    }
    const user = await userService.findByEmail(input.email)
    return toPublicUser(user)
  }),
} satisfies TRPCRouterRecord

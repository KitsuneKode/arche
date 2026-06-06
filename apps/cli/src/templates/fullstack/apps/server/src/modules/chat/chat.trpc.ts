import type { TRPCRouterRecord } from '@trpc/server'
import { protectedProcedure, publicProcedure } from '../trpc/trpc.js'
import { sendMessageSchema } from './chat.dto'
import { chatService } from './chat.service'

export const chatRouter = {
  list: publicProcedure.query(() => chatService.listMessages()),

  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(({ ctx, input }) => chatService.sendMessage(ctx.session.user.id, input.content)),
} satisfies TRPCRouterRecord

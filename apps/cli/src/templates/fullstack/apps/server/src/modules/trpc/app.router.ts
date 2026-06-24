import { z } from 'zod'
import { authRouter } from '../auth/auth.trpc'
import { chatRouter } from '../chat/chat.trpc'
import { demoRouter } from '../demo/demo.trpc'
import { postRouter } from '../post/post.trpc'
import { userRouter } from '../user/user.trpc'
import { createTRPCRouter, publicProcedure } from './trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  post: postRouter,
  chat: chatRouter,
  demo: demoRouter,
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Hi ${input.name} from TRPC`),
})

export type AppRouter = typeof appRouter

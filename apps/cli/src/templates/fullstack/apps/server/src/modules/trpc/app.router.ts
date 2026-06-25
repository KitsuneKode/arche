import { z } from 'zod'
import { authRouter } from '../auth/auth.trpc'
import { postRouter } from '../post/post.trpc'
import { userRouter } from '../user/user.trpc'
import { createTRPCRouter, publicProcedure } from './trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  post: postRouter,
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Hi ${input.name} from TRPC`),
})

export type AppRouter = typeof appRouter

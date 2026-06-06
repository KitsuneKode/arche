import { auth, fromNodeHeaders } from '@arche-template/auth/server'
import { initTRPC, TRPCError } from '@trpc/server'
import type * as trpcExpress from '@trpc/server/adapters/express'
import superjson from 'superjson'
import { z, ZodError } from 'zod/v4'
import { logger } from '../../common/logger'
import { prisma as db } from '../../db/index.js'

export const createTRPCContext = async ({
  req,
  res: _res,
}: trpcExpress.CreateExpressContextOptions) => {
  const headers = fromNodeHeaders(req.headers)
  const session = await auth.api.getSession({ headers })
  return { session, db }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  const result = await next()
  const elapsed = Date.now() - start
  logger.info(`[TRPC] ${path} took ${elapsed}ms to execute`)

  return result
})

export const publicProcedure = t.procedure.use(timingMiddleware)

export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

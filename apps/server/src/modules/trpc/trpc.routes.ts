import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { type Router as ExpressRouter, Router } from 'express'
import { env } from '../../common/env'
import { logger } from '../../common/logger'
import { appRouter } from './app.router'
import { createTRPCContext } from './trpc'

export const trpcRoutes: ExpressRouter = Router()

const expressMiddleWare = createExpressMiddleware({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === 'development'
      ? ({ path, error }) => {
          logger.error(`[TRPC] tRPC failed on ${path ?? '<no-path>'}: ${error.message}`, error)
        }
      : undefined,
})

trpcRoutes.use('/', expressMiddleWare)

export { expressMiddleWare }

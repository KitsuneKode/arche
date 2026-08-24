import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { appRouter } from './app.router'
import { createCallerFactory, createTRPCContext } from './trpc'

export type RouterInputs = inferRouterInputs<typeof appRouter>
export type RouterOutputs = inferRouterOutputs<typeof appRouter>

export const createCaller = createCallerFactory(appRouter)

export { appRouter, createTRPCContext, createCallerFactory }
export type { AppRouter } from './app.router'

// Express-specific: import directly from './trpc.routes' in server code
export { expressMiddleWare } from './trpc.routes'

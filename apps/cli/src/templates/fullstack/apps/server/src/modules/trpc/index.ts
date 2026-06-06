import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { appRouter } from './app.router'
import { createCallerFactory, createTRPCContext } from './trpc'
import { expressMiddleWare } from './trpc.routes'

export type RouterInputs = inferRouterInputs<typeof appRouter>
export type RouterOutputs = inferRouterOutputs<typeof appRouter>

export const createCaller = createCallerFactory(appRouter)

export { appRouter, createTRPCContext, createCallerFactory, expressMiddleWare }
export type { AppRouter } from './app.router'

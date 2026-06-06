/**
 * @arche-template/trpc — client-facing API contract
 *
 * Implementation lives in apps/server/src/modules (module-first architecture).
 * This package re-exports types and server callers for web/worker consumers.
 *
 * Boundary:
 * - HTTP mounts, REST routes: apps/server/src/modules/*
 * - tRPC procedures: apps/server/src/modules/<feature>/*.trpc.ts
 * - App router composition: apps/server/src/modules/trpc/app.router.ts
 */

export type { AppRouter, RouterInputs, RouterOutputs } from '@arche-template/server/trpc'
export {
  appRouter,
  createCaller,
  createTRPCContext,
  createCallerFactory,
  expressMiddleWare,
} from '@arche-template/server/trpc'

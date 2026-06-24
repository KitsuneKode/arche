import 'server-only' // <-- ensure this file cannot be imported from the client
import { auth } from '@arche-template/auth/server'
import { prisma as db } from '@arche-template/store'
import { createCaller } from '@arche-template/trpc'
import { headers } from 'next/headers'
import { cache } from 'react'

export { getQueryClient, HydrateClient, prefetch, trpc } from './http-server'

/** In-process tRPC for RSC and server actions — prefer over HTTP `trpc` below. */
export const trpcCaller = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return createCaller({ session, db })
})

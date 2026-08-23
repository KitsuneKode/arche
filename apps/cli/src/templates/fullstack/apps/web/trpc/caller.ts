import 'server-only'

import { auth } from '@arche-template/auth/server'
import { prisma as db } from '@arche-template/store'
import { createCaller } from '@arche-template/trpc'
import { headers } from 'next/headers'
import { cache } from 'react'

/** In-process tRPC for RSC and server actions — prefer over HTTP `trpc` in server.tsx. */
export const trpcCaller = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return createCaller({ session, db })
})

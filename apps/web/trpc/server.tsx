import 'server-only' // <-- ensure this file cannot be imported from the client
import { auth } from '@arche-template/auth/server'
import { prisma as db } from '@arche-template/store'
import { createCaller } from '@arche-template/trpc'
import type { AppRouter } from '@arche-template/trpc'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createTRPCClient, httpLink } from '@trpc/client'
import { createTRPCOptionsProxy, TRPCQueryOptions } from '@trpc/tanstack-react-query'
import { headers } from 'next/headers'
import React, { cache } from 'react'
import { SuperJSON } from 'superjson'
import config from '@/env'
import { makeQueryClient } from './query-client'

export const getQueryClient = cache(makeQueryClient)

/** In-process tRPC for RSC and server actions — prefer over HTTP `trpc` below. */
export const trpcCaller = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return createCaller({ session, db })
})

/** HTTP client for Client Components and prefetch/hydration — not for direct RSC data. */
function getUrl() {
  const base = (() => {
    // if (typeof window !== 'undefined') return ''
    return config.NEXT_PUBLIC_API_URL
  })()
  return `${base}/api/trpc`
}

export const trpc = createTRPCOptionsProxy({
  client: createTRPCClient<AppRouter>({
    links: [httpLink({ url: getUrl(), transformer: SuperJSON })],
  }),
  queryClient: getQueryClient,
})

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
  const queryClient = getQueryClient()

  try {
    if (queryOptions.queryKey[1]?.type === 'infinite') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await queryClient.prefetchInfiniteQuery(queryOptions as any)
    } else {
      await queryClient.prefetchQuery(queryOptions)
    }
  } catch {
    // API offline during build or dev — client still probes on hydrate
  }
}

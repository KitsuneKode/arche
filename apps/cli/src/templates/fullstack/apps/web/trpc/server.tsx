import 'server-only'
import { auth } from '@arche-template/auth/server'
import { createCaller } from '@arche-template/server/trpc'
import { db } from '@arche-template/store'
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

export const trpcCaller = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return createCaller({ session, db })
})

function getUrl() {
  return `${config.NEXT_PUBLIC_API_URL}/api/trpc`
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
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(queryOptions: T) {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    void queryClient.prefetchQuery(queryOptions)
  }
}

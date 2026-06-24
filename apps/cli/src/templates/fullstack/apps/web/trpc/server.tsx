import 'server-only'
import type { AppRouter } from '@arche-template/trpc'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createTRPCClient, httpLink } from '@trpc/client'
import { createTRPCOptionsProxy, TRPCQueryOptions } from '@trpc/tanstack-react-query'
import React, { cache } from 'react'
import { SuperJSON } from 'superjson'
import config from '@/env'
import { makeQueryClient } from './query-client'

const getQueryClient = cache(makeQueryClient)

function getUrl() {
  return `${config.NEXT_PUBLIC_API_URL}/api/trpc`
}

/** HTTP tRPC proxy for RSC prefetch and client hydration. */
export const trpc = createTRPCOptionsProxy({
  client: createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: getUrl(),
        transformer: SuperJSON,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
      }),
    ],
  }),
  queryClient: getQueryClient,
})

/** Typed hello query options for the homepage demo (avoids non-null assertions on optional routers). */
export function helloQueryOptions(name: string) {
  return trpc.hello.queryOptions({ name })
}

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

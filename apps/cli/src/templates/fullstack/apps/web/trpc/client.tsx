'use client'
import type { AppRouter } from '@arche-template/trpc'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
import { useState } from 'react'
import { SuperJSON } from 'superjson'
import config from '@/env'
import { makeQueryClient } from './query-client'

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  return `${config.NEXT_PUBLIC_API_URL}/api/trpc`
}

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchLink({
          transformer: SuperJSON,
          url: getUrl(),
          headers: () => {
            const headers = new Headers()
            headers.set('x-trpc-source', 'react-next')
            return headers
          },
          fetch: (url, options) =>
            fetch(url, {
              ...options,
              credentials: 'include',
            }),
        }),
      ],
    }),
  )
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}

'use client'
import type { AppRouter } from '@arche-template/server/trpc'
import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCContext } from '@trpc/tanstack-react-query'
// ^-- to make sure we can mount the Provider from a server component
import { useState } from 'react'
import { SuperJSON } from 'superjson'
import { apiPath } from '@/lib/api-origin'
import { makeQueryClient } from './query-client'
export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()
let browserQueryClient: QueryClient
/**
 * Returns a React Query client instance, creating a new one per request on the server or reusing a singleton on the browser.
 *
 * Ensures that the same query client is reused across renders in the browser to prevent issues with React suspense and data consistency.
 * On the server, always creates a new client to avoid sharing state between requests.
 *
 * @returns The React Query client instance
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
/**
 * Constructs the full tRPC API endpoint URL using the configured API base URL.
 *
 * @returns The complete URL for the tRPC API endpoint.
 */
function getUrl() {
  return apiPath('/api/trpc')
}

/**
 * Provides tRPC and React Query contexts to descendant components.
 *
 * Creates or reuses a React Query client and a stable tRPC client, then wraps `children` with
 * `QueryClientProvider` and `TRPCProvider` so hooks and components in the subtree can access the
 * configured clients.
 *
 * @param props - Component props containing the React children to render inside the providers.
 */
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
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
          transformer: SuperJSON, //<-- if you use a data transformer
          url: getUrl(),
          headers: () => {
            const headers = new Headers()
            headers.set('x-trpc-source', 'react-next')
            return headers
          },

          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              credentials: 'include',
            })
          },
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

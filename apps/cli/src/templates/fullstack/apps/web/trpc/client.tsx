import type { AppRouter } from '@arche-template/trpc'
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client'
import superjson from 'superjson'

function getTrpcUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  return `${baseUrl.replace(/\/$/, '')}/api/trpc`
}

const client = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === 'development' ||
        (op.direction === 'down' && op.result instanceof Error),
    }),
    httpBatchLink({
      transformer: superjson,
      url: getTrpcUrl(),
      headers: () => {
        const headers = new Headers()
        headers.set('x-trpc-source', 'next-web')
        return headers
      },
      fetch: (url, options) =>
        fetch(url, {
          ...options,
          credentials: 'include',
        }),
    }),
  ],
})

export function queryHello(name: string): Promise<string> {
  return client.hello.query({ name })
}

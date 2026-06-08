'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'

export function TrpcStatus() {
  const trpc = useTRPC()
  const { data, isPending, isError, error } = useQuery(trpc.hello.queryOptions({ name: 'Arche' }))

  const status = isPending ? 'checking' : isError ? 'offline' : 'online'
  const message = isPending ? 'Checking tRPC contract...' : isError ? error.message : data

  return (
    <section className="status" aria-label="Live API status">
      <div>
        <span className={status === 'online' ? 'dot online' : 'dot'} />
        <p className="eyebrow">Live tRPC check</p>
        <h2>{message}</h2>
      </div>
      <code>NEXT_PUBLIC_API_URL=http://localhost:3001</code>
    </section>
  )
}

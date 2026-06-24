'use client'

import { useQuery } from '@tanstack/react-query'

import { useSandboxApiSeed } from '@/components/sandbox/sandbox-api-context'
import {
  apiHealthQueryKey,
  API_HEALTH_CLIENT_TIMEOUT_MS,
  probeApiHealth,
  type ApiHealthStatus,
} from '@/lib/api-health'

export type ApiReachableState = {
  status: ApiHealthStatus
  isPending: boolean
  isRefetching: boolean
  isConfirmedOffline: boolean
  seededOnline: boolean
}

export function useApiReachable(): ApiReachableState {
  const seed = useSandboxApiSeed()
  const query = useQuery({
    queryKey: apiHealthQueryKey,
    queryFn: () => probeApiHealth({ timeoutMs: API_HEALTH_CLIENT_TIMEOUT_MS }),
    initialData: seed ?? undefined,
    staleTime: 30_000,
    retry: 2,
  })

  const status = query.data ?? seed ?? { reachable: false }
  const seededOnline = seed?.reachable === true
  const clientSaysOffline = query.data?.reachable === false
  const isConfirmedOffline =
    clientSaysOffline && (!seededOnline || (!query.isPending && !query.isFetching))

  return {
    status,
    isPending: query.isPending && !seed,
    isRefetching: query.isFetching && !query.isPending,
    isConfirmedOffline,
    seededOnline,
  }
}

'use client'

import { useQuery } from '@tanstack/react-query'

import { apiHealthQueryKey, API_HEALTH_FIRST_PROBE_MS, probeApiHealth } from '@/lib/api-health'

const API_HEALTH_BACKGROUND_MS = 20_000

export function useApiReachable() {
  return useQuery({
    queryKey: apiHealthQueryKey,
    queryFn: () => probeApiHealth({ timeoutMs: API_HEALTH_FIRST_PROBE_MS }),
    staleTime: 15_000,
    refetchInterval: (query) => {
      if (typeof document !== 'undefined' && document.hidden) return false
      if (query.state.status === 'error') return API_HEALTH_BACKGROUND_MS
      return API_HEALTH_BACKGROUND_MS
    },
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

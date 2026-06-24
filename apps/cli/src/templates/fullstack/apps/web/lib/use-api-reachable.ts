'use client'

import { useQuery } from '@tanstack/react-query'

import { apiHealthQueryKey, API_HEALTH_FIRST_PROBE_MS, probeApiHealth } from '@/lib/api-health'

export function useApiReachable() {
  return useQuery({
    queryKey: apiHealthQueryKey,
    queryFn: () => probeApiHealth({ timeoutMs: API_HEALTH_FIRST_PROBE_MS }),
    staleTime: 30_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
    refetchOnWindowFocus: true,
  })
}

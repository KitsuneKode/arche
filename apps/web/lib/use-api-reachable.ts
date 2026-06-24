'use client'

import { useQuery } from '@tanstack/react-query'

import { apiHealthQueryKey, fetchApiHealth } from '@/lib/api-health'

export function useApiReachable() {
  return useQuery({
    queryKey: apiHealthQueryKey,
    queryFn: fetchApiHealth,
    staleTime: 30_000,
    retry: 1,
  })
}

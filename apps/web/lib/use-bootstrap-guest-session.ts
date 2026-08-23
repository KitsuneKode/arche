'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { ensureGuestSession } from '@/lib/ensure-guest-session'
import { useTRPC } from '@/trpc/client'

/**
 * Establishes an anonymous Better Auth session as soon as /live loads when the API
 * is reachable. Without this, guests only sign in on first chat send or score
 * submit — returning visitors with a missing/expired cookie get a new user id and
 * prior messages no longer show as "You".
 */
export function useBootstrapGuestSession({
  enabled,
  hasSession,
  isRegistered,
  sessionFetched,
}: {
  enabled: boolean
  hasSession: boolean
  isRegistered: boolean
  sessionFetched: boolean
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !sessionFetched || hasSession || isRegistered) return
    if (startedRef.current) return
    startedRef.current = true

    void ensureGuestSession(queryClient, trpc.auth.getSession.queryKey(), () =>
      queryClient.fetchQuery(trpc.auth.getSession.queryOptions()),
    ).catch(() => {
      startedRef.current = false
    })
  }, [enabled, hasSession, isRegistered, queryClient, sessionFetched, trpc.auth.getSession])
}

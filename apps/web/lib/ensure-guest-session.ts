'use client'

import { signInAnonymous } from '@arche-template/auth/client'
import type { QueryClient } from '@tanstack/react-query'

export { isRegisteredUser } from '@/lib/guest-session'

type GuestSession = {
  user: {
    id: string
    isAnonymous?: boolean | null
  }
}

export async function ensureGuestSession(
  queryClient: QueryClient,
  sessionQueryKey: readonly unknown[],
  fetchSession: () => Promise<GuestSession | null | undefined>,
): Promise<GuestSession> {
  const existing = await fetchSession()
  if (existing?.user?.id) return existing

  const result = await signInAnonymous()
  if (result.error) {
    throw new Error(result.error.message ?? 'Could not start guest session')
  }

  await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
  const session = await fetchSession()
  if (!session?.user?.id) {
    throw new Error('Guest session was not established')
  }
  return session
}

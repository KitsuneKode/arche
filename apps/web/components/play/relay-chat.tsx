'use client'

import { useQuery } from '@tanstack/react-query'

import { LiveChat } from '@/components/live/live-chat'
import { useTRPC } from '@/trpc/client'

export function RelayChat() {
  const trpc = useTRPC()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const userId = sessionQuery.data?.user?.id

  return <LiveChat signedIn={signedIn} userId={userId} />
}

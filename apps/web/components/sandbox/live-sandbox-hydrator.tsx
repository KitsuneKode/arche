import type { ReactNode } from 'react'

import { HydrateClient, prefetch, trpc } from '@/trpc/http-server'

type LiveSandboxHydratorProps = {
  children: ReactNode
  prefetchChat?: boolean
}

export async function LiveSandboxHydrator({
  children,
  prefetchChat = false,
}: LiveSandboxHydratorProps) {
  await prefetch(trpc.auth.getSession.queryOptions())
  if (prefetchChat) {
    await prefetch(trpc.chat.list.queryOptions())
  }

  return <HydrateClient>{children}</HydrateClient>
}

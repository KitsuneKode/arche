import type { ReactNode } from 'react'

import { HydrateClient, prefetch, trpc } from '@/trpc/server'

export async function LiveSandboxHydrator({ children }: { children: ReactNode }) {
  await prefetch(trpc.auth.getSession.queryOptions())
  return <HydrateClient>{children}</HydrateClient>
}

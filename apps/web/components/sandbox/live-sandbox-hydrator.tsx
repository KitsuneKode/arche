import type { ReactNode } from 'react'

import { HydrateClient } from '@/trpc/http-server'

/** Sync wrapper — server prefetch blocked PPR stream on Vercel; client hydrates queries. */
export function LiveSandboxHydrator({ children }: { children: ReactNode }) {
  return <HydrateClient>{children}</HydrateClient>
}

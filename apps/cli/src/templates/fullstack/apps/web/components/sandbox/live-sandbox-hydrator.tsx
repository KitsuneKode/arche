import type { ReactNode } from 'react'

import { HydrateClient } from '@/trpc/server'

export function LiveSandboxHydrator({ children }: { children: ReactNode }) {
  return <HydrateClient>{children}</HydrateClient>
}

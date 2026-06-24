import type { ReactNode } from 'react'

import { TRPCReactProvider } from '@/trpc/client'

export default function LiveLayout({ children }: { children: ReactNode }) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>
}

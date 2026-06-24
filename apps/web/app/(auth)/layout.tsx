import type { ReactNode } from 'react'

import { TRPCReactProvider } from '@/trpc/client'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>
}

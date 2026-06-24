'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { ApiHealthStatus } from '@/lib/api-health'

const SandboxApiContext = createContext<ApiHealthStatus | null>(null)

export function SandboxApiProvider({
  initialHealth,
  children,
}: {
  initialHealth: ApiHealthStatus
  children: ReactNode
}) {
  return <SandboxApiContext.Provider value={initialHealth}>{children}</SandboxApiContext.Provider>
}

export function useSandboxApiSeed(): ApiHealthStatus | null {
  return useContext(SandboxApiContext)
}

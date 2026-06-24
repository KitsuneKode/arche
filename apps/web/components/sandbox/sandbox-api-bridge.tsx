import type { ReactNode } from 'react'

import { SandboxApiProvider } from '@/components/sandbox/sandbox-api-context'
import { API_HEALTH_SERVER_TIMEOUT_MS, probeApiHealth } from '@/lib/api-health'
import { HydrateClient, prefetch, trpc } from '@/trpc/http-server'

export async function SandboxApiBridge({ children }: { children: ReactNode }) {
  const initialHealth = await probeApiHealth({ timeoutMs: API_HEALTH_SERVER_TIMEOUT_MS })

  try {
    await prefetch(trpc.auth.getSession.queryOptions())
  } catch {
    // API offline during build or cold start — client still probes on hydrate
  }

  return (
    <HydrateClient>
      <SandboxApiProvider initialHealth={initialHealth}>{children}</SandboxApiProvider>
    </HydrateClient>
  )
}

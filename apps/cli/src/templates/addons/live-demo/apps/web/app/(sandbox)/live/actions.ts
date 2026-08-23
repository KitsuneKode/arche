'use server'

import { API_HEALTH_SERVER_TIMEOUT_MS } from '@/lib/api-health'
import { apiPath } from '@/lib/api-origin'
import { trpcCaller } from '@/trpc/server'

export async function probeHello(name: string) {
  const trimmed = name.trim().slice(0, 64) || 'Arche'
  const api = await trpcCaller()
  const message = await api.hello({ name: trimmed })
  return { message, via: 'trpcCaller' as const }
}

export async function probeHealth() {
  const url = apiPath('/health', false)
  const started = Date.now()
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(API_HEALTH_SERVER_TIMEOUT_MS),
    })
    const body = (await response.json()) as {
      status?: string
      database?: string
      schema?: string
    }
    return {
      ok: response.ok,
      status: body.status ?? (response.ok ? 'OK' : 'ERROR'),
      database: body.database,
      schema: body.schema,
      latencyMs: Date.now() - started,
      via: 'server-fetch' as const,
    }
  } catch (error) {
    return {
      ok: false,
      status: 'ERROR',
      database: 'disconnected' as const,
      schema: 'unknown' as const,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Health probe failed',
      via: 'server-fetch' as const,
    }
  }
}

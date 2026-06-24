import config from '@/env'

export const API_HEALTH_CLIENT_TIMEOUT_MS = 3_000
export const API_HEALTH_SERVER_TIMEOUT_MS = 10_000
export const API_HEALTH_FIRST_PROBE_MS = 8_000

/** @deprecated Use API_HEALTH_CLIENT_TIMEOUT_MS */
export const API_HEALTH_TIMEOUT_MS = API_HEALTH_CLIENT_TIMEOUT_MS

export const apiHealthQueryKey = ['sandbox', 'api-health'] as const

export type ApiHealthStatus = {
  reachable: boolean
  database?: string
  latencyMs?: number
}

type ProbeApiHealthOptions = {
  timeoutMs?: number
  signal?: AbortSignal
}

function isConnectedDatabase(database: string | undefined): boolean {
  return database === 'connected'
}

export function getApiHealthFetchUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/demo-health'
  }
  return `${config.NEXT_PUBLIC_API_URL}/health`
}

export async function probeApiHealth(
  options: ProbeApiHealthOptions = {},
): Promise<ApiHealthStatus> {
  const timeoutMs = options.timeoutMs ?? API_HEALTH_CLIENT_TIMEOUT_MS
  const isClient = typeof window !== 'undefined'
  const started = isClient ? Date.now() : 0
  const url = getApiHealthFetchUrl()

  try {
    const response = await fetch(url, {
      signal: options.signal ?? AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
    const latencyMs = isClient ? Date.now() - started : undefined

    if (!response.ok) {
      return { reachable: false, latencyMs }
    }

    const body = (await response.json()) as ApiHealthStatus & {
      database?: string
      status?: string
    }

    if (typeof body.reachable === 'boolean' && url === '/api/demo-health') {
      return {
        reachable: body.reachable,
        database: body.database,
        latencyMs: body.latencyMs ?? latencyMs,
      }
    }

    const reachable = isConnectedDatabase(body.database)
    return {
      reachable,
      database: body.database,
      latencyMs,
    }
  } catch {
    return {
      reachable: false,
      latencyMs: isClient ? Date.now() - started : undefined,
    }
  }
}

export async function fetchApiHealth(): Promise<boolean> {
  const status = await probeApiHealth({ timeoutMs: API_HEALTH_CLIENT_TIMEOUT_MS })
  return status.reachable
}

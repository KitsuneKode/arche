import config from '@/env'

export const API_HEALTH_TIMEOUT_MS = 3_000

export const apiHealthQueryKey = ['sandbox', 'api-health'] as const

export async function fetchApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${config.NEXT_PUBLIC_API_URL}/health`, {
      signal: AbortSignal.timeout(API_HEALTH_TIMEOUT_MS),
    })
    if (!response.ok) return false
    const body = (await response.json()) as { database?: string }
    return body.database === 'connected'
  } catch {
    return false
  }
}

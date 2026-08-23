export type FetchJsonResult<T> = {
  status: number
  body: T
  headers: Headers
}

export async function fetchJson<T = unknown>(
  url: string,
  options?: { timeoutMs?: number; method?: string },
): Promise<FetchJsonResult<T>> {
  const timeoutMs = options?.timeoutMs ?? 120_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const headers: Record<string, string> = { Accept: 'application/json' }
  const bypass = process.env.VERCEL_PROTECTION_BYPASS?.trim()
  if (bypass) {
    headers['x-vercel-protection-bypass'] = bypass
  }

  try {
    const res = await fetch(url, {
      method: options?.method ?? 'GET',
      signal: controller.signal,
      headers,
    })
    const text = await res.text()
    let body: T
    try {
      body = JSON.parse(text) as T
    } catch {
      throw new Error(`Expected JSON from ${url} (HTTP ${res.status}): ${text.slice(0, 200)}`)
    }
    return { status: res.status, body, headers: res.headers }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timed out after ${timeoutMs}ms: ${url}`, { cause: error })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export function resolveDeployApiBaseUrl(): string {
  const raw = process.env.API_BASE_URL?.trim()
  const base = raw && raw.length > 0 ? raw : 'https://arche-template-api.onrender.com'
  return base.replace(/\/$/, '')
}

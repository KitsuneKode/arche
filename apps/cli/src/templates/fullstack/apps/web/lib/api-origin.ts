export function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

function publicApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''
}

function publicAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? ''
}

export function usesSameOriginApiProxy(): boolean {
  if (process.env.API_UPSTREAM_URL?.trim()) return true
  const api = publicApiUrl()
  const app = publicAppUrl()
  if (!api || !app) return false
  return normalizeOrigin(api) === normalizeOrigin(app)
}

export function getServerApiOrigin(): string {
  const upstream = process.env.API_UPSTREAM_URL?.trim()
  if (upstream) return normalizeOrigin(upstream)
  return normalizeOrigin(publicApiUrl())
}

export function getClientApiOrigin(): string {
  if (usesSameOriginApiProxy()) return ''
  return normalizeOrigin(publicApiUrl())
}

export function apiPath(path: string, client = typeof window !== 'undefined'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = client ? getClientApiOrigin() : getServerApiOrigin()
  return origin ? `${origin}${normalized}` : normalized
}

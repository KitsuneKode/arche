import config from '@/env'

export function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

/** True when the web app proxies API traffic (rewrites) instead of cross-origin fetches. */
export function usesSameOriginApiProxy(): boolean {
  if (process.env.API_UPSTREAM_URL?.trim()) return true
  return normalizeOrigin(config.NEXT_PUBLIC_API_URL) === normalizeOrigin(config.NEXT_PUBLIC_APP_URL)
}

/** Upstream API host for server-side fetches and Next rewrites. */
export function getServerApiOrigin(): string {
  const upstream = process.env.API_UPSTREAM_URL?.trim()
  if (upstream) return normalizeOrigin(upstream)
  return normalizeOrigin(config.NEXT_PUBLIC_API_URL)
}

/** Browser API base — empty string means same-origin relative paths. */
export function getClientApiOrigin(): string {
  if (usesSameOriginApiProxy()) return ''
  return normalizeOrigin(config.NEXT_PUBLIC_API_URL)
}

export function apiPath(path: string, client = typeof window !== 'undefined'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = client ? getClientApiOrigin() : getServerApiOrigin()
  return origin ? `${origin}${normalized}` : normalized
}

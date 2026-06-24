/**
 * Chat realtime policy — no env imports so tests and SSR stay isolated.
 */
function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

/** Same-origin API proxy (Vercel rewrites or matching public URLs). */
function usesSameOriginApiProxy(): boolean {
  if (process.env.API_UPSTREAM_URL?.trim()) return true
  const api = process.env.NEXT_PUBLIC_API_URL?.trim()
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!api || !app) return false
  return normalizeOrigin(api) === normalizeOrigin(app)
}

export function isChatSseEnabled() {
  const flag = process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE?.trim().toLowerCase()
  if (flag === 'true' || flag === '1') return true
  if (flag === 'false' || flag === '0') return false
  if (usesSameOriginApiProxy()) return true
  return process.env.NODE_ENV !== 'production'
}

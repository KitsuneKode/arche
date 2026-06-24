/**
 * Chat realtime policy — no env imports so tests and SSR stay isolated.
 */
export function isChatSseEnabled() {
  const flag = process.env.NEXT_PUBLIC_ENABLE_CHAT_SSE?.trim().toLowerCase()
  if (flag === 'true' || flag === '1') return true
  if (flag === 'false' || flag === '0') return false
  return process.env.NODE_ENV !== 'production'
}

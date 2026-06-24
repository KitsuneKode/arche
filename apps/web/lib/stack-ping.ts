export type PingResult = {
  ms: number
  at: string
}

export const PING_STORAGE_KEY = 'arche-stack-ping-history'
export const PING_HISTORY_LIMIT = 5

export function appendPing(
  history: PingResult[],
  next: PingResult,
  limit = PING_HISTORY_LIMIT,
): PingResult[] {
  return [next, ...history].slice(0, limit)
}

export function bestPingMs(history: PingResult[]): number | null {
  if (!history.length) return null
  return Math.min(...history.map((entry) => entry.ms))
}

export function readPingHistory(storageKey = PING_STORAGE_KEY): PingResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is PingResult =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as PingResult).ms === 'number' &&
        typeof (entry as PingResult).at === 'string',
    )
  } catch {
    return []
  }
}

export function writePingHistory(history: PingResult[], storageKey = PING_STORAGE_KEY) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(history))
  } catch {
    // ignore quota / private mode
  }
}

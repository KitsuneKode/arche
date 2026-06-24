export type PingResult = {
  ms: number
  at: string
}

export type PingTier = 'excellent' | 'good' | 'fair' | 'slow'

export const PING_STORAGE_KEY = 'arche-stack-ping-history'
export const PING_HISTORY_LIMIT = 5

export const PING_TIER_THRESHOLDS = {
  excellent: 100,
  good: 200,
  fair: 300,
} as const

export function pingTier(ms: number): PingTier {
  if (ms < PING_TIER_THRESHOLDS.excellent) return 'excellent'
  if (ms < PING_TIER_THRESHOLDS.good) return 'good'
  if (ms < PING_TIER_THRESHOLDS.fair) return 'fair'
  return 'slow'
}

export function pingTierMeta(tier: PingTier) {
  const meta: Record<
    PingTier,
    { label: string; headline: string; barClass: string; textClass: string; ringClass: string }
  > = {
    excellent: {
      label: 'Blazing',
      headline: 'Sub-100ms — the stack feels instant.',
      barClass: 'bg-emerald-400',
      textClass: 'text-emerald-300',
      ringClass: 'ring-emerald-500/50',
    },
    good: {
      label: 'Solid',
      headline: 'Under 200ms — responsive for most UIs.',
      barClass: 'bg-lime-400',
      textClass: 'text-lime-300',
      ringClass: 'ring-lime-500/50',
    },
    fair: {
      label: 'Warm',
      headline: 'Under 300ms — noticeable but usable.',
      barClass: 'bg-amber-400',
      textClass: 'text-amber-300',
      ringClass: 'ring-amber-500/50',
    },
    slow: {
      label: 'Sluggish',
      headline: 'Over 300ms — check network or API region.',
      barClass: 'bg-red-400',
      textClass: 'text-red-300',
      ringClass: 'ring-red-500/50',
    },
  }
  return meta[tier]
}

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

/** Consecutive recent pings under the "fair" threshold (300ms), newest first. */
export function hotStreak(history: PingResult[], maxMs = PING_TIER_THRESHOLDS.fair): number {
  let streak = 0
  for (const entry of history) {
    if (entry.ms < maxMs) streak += 1
    else break
  }
  return streak
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

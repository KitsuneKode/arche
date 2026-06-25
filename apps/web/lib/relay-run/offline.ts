const LEADERBOARD_CACHE_KEY = 'relay-run-leaderboard-cache'
const PENDING_SCORE_KEY = 'relay-run-pending-score'

export type CachedLeaderboardEntry = {
  rank: number
  userId: string
  score: number
  displayName: string
  createdAt: string
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / privacy mode
  }
}

export function readCachedLeaderboard(): CachedLeaderboardEntry[] {
  return readJson<CachedLeaderboardEntry[]>(LEADERBOARD_CACHE_KEY) ?? []
}

export function writeCachedLeaderboard(entries: CachedLeaderboardEntry[]): void {
  writeJson(LEADERBOARD_CACHE_KEY, entries.slice(0, 10))
}

export function readPendingScore(): number | null {
  const value = readJson<number>(PENDING_SCORE_KEY)
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return null
  return value
}

export function writePendingScore(score: number): void {
  const current = readPendingScore()
  if (current !== null && score <= current) return
  writeJson(PENDING_SCORE_KEY, score)
}

export function clearPendingScore(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PENDING_SCORE_KEY)
  } catch {
    // ignore
  }
}

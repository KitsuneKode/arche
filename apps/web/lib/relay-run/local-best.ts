const LOCAL_BEST_KEY = 'relay-run-local-best'

export function readLocalBest(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(LOCAL_BEST_KEY)
    if (!raw) return 0
    const value = Number.parseInt(raw, 10)
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function writeLocalBest(score: number): void {
  if (typeof window === 'undefined') return
  try {
    const current = readLocalBest()
    if (score > current) {
      window.localStorage.setItem(LOCAL_BEST_KEY, String(score))
    }
  } catch {
    // ignore quota / privacy mode
  }
}

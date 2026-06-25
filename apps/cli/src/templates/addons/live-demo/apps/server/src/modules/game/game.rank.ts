/** Rank = 1 + count of users with a strictly higher best score. */
export function rankForBestScore(usersAbove: number): number {
  return usersAbove + 1
}

/** Collapse raw score rows to one best entry per user, highest score first. */
export function mergeBestPerUser<T extends { userId: string; score: number }>(rows: T[]): T[] {
  const bestByUser = new Map<string, T>()
  for (const row of rows) {
    const current = bestByUser.get(row.userId)
    if (!current || row.score > current.score) bestByUser.set(row.userId, row)
  }
  return [...bestByUser.values()].sort((a, b) => b.score - a.score)
}

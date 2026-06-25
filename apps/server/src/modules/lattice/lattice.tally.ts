export function countVotes(votes: Array<{ choice: string }>): { votesA: number; votesB: number } {
  let votesA = 0
  let votesB = 0
  for (const vote of votes) {
    if (vote.choice === 'a') votesA += 1
    else if (vote.choice === 'b') votesB += 1
  }
  return { votesA, votesB }
}

export function pickRoundWinner(
  cellAId: string,
  cellBId: string,
  votes: Array<{ choice: string }>,
  random: () => number = Math.random,
): { votesA: number; votesB: number; winnerId: string; tieBreak: boolean } {
  const { votesA, votesB } = countVotes(votes)
  if (votesA === votesB) {
    return {
      votesA,
      votesB,
      winnerId: random() < 0.5 ? cellAId : cellBId,
      tieBreak: true,
    }
  }
  return {
    votesA,
    votesB,
    winnerId: votesA > votesB ? cellAId : cellBId,
    tieBreak: false,
  }
}

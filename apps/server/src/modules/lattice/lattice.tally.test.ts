import { describe, expect, it } from 'bun:test'

import { pickRoundWinner } from './lattice.tally.js'

describe('pickRoundWinner', () => {
  it('picks higher vote count', () => {
    const result = pickRoundWinner('a', 'b', [{ choice: 'b' }, { choice: 'b' }], () => 0)
    expect(result.winnerId).toBe('b')
    expect(result.tieBreak).toBe(false)
  })

  it('coin-flips on a tie', () => {
    expect(pickRoundWinner('a', 'b', [], () => 0).winnerId).toBe('a')
    expect(pickRoundWinner('a', 'b', [], () => 0.99).winnerId).toBe('b')
    expect(pickRoundWinner('a', 'b', [], () => 0).tieBreak).toBe(true)
  })
})

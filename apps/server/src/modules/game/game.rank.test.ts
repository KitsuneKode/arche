import { describe, expect, it } from 'bun:test'

import { mergeBestPerUser, rankForBestScore } from './game.rank.js'

describe('game.rank', () => {
  it('rankForBestScore is one plus users above', () => {
    expect(rankForBestScore(0)).toBe(1)
    expect(rankForBestScore(3)).toBe(4)
  })

  it('mergeBestPerUser keeps highest score per user', () => {
    const merged = mergeBestPerUser([
      { userId: 'a', score: 5 },
      { userId: 'a', score: 12 },
      { userId: 'b', score: 8 },
      { userId: 'b', score: 3 },
      { userId: 'c', score: 12 },
    ])

    expect(merged).toEqual([
      { userId: 'a', score: 12 },
      { userId: 'c', score: 12 },
      { userId: 'b', score: 8 },
    ])
  })
})

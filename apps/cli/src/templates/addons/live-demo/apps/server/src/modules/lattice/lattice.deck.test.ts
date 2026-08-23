import { describe, expect, it } from 'bun:test'

import { cellLabel, CLASH_PAIRS, LATTICE_CELLS } from './lattice.deck'

describe('lattice.deck', () => {
  it('defines 25 cells for the 5x5 grid', () => {
    expect(LATTICE_CELLS).toHaveLength(25)
  })

  it('resolves labels for known cell ids', () => {
    expect(cellLabel('sse')).toBe('SSE')
    expect(cellLabel('unknown')).toBe('unknown')
  })

  it('has themed clash pairs', () => {
    expect(CLASH_PAIRS.length).toBeGreaterThan(5)
    for (const [a, b] of CLASH_PAIRS) {
      expect(a).not.toBe(b)
    }
  })
})

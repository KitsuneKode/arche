import { describe, expect, it } from 'bun:test'

import { createInitialState, flap, tick } from './engine'

describe('relay-run engine', () => {
  it('starts alive with zero score', () => {
    const state = createInitialState()
    expect(state.alive).toBe(true)
    expect(state.score).toBe(0)
  })

  it('flap sets upward velocity', () => {
    const after = flap(createInitialState())
    expect(after.bird.vy).toBeLessThan(0)
  })

  it('dies when bird hits ceiling', () => {
    let state = createInitialState()
    state = { ...state, bird: { ...state.bird, y: 1, vy: -20 } }
    for (let i = 0; i < 30; i++) state = tick(state)
    expect(state.alive).toBe(false)
  })
})

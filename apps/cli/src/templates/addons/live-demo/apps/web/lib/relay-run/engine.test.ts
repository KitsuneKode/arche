import { describe, expect, it } from 'bun:test'

import {
  createInitialState,
  flap,
  GAME_HEIGHT,
  GROUND_HEIGHT,
  getMedal,
  shouldSimulateGame,
  startGame,
  tick,
} from './engine'

describe('relay-run engine', () => {
  it('starts idle with zero score', () => {
    const state = createInitialState()
    expect(state.phase).toBe('idle')
    expect(state.score).toBe(0)
  })

  it('flap from idle starts playing', () => {
    const after = flap(createInitialState())
    expect(after.phase).toBe('playing')
    expect(after.bird.vy).toBeLessThan(0)
  })

  it('flap sets upward velocity while playing', () => {
    const playing = startGame()
    const after = flap(playing)
    expect(after.phase).toBe('playing')
    expect(after.bird.vy).toBeLessThan(0)
  })

  it('dies when bird hits ceiling', () => {
    let state = startGame()
    state = { ...state, bird: { ...state.bird, y: 1, vy: -20 } }
    for (let i = 0; i < 30; i++) state = tick(state)
    expect(state.phase).toBe('dead')
  })

  it('dies when bird hits ground strip', () => {
    let state = startGame()
    const groundY = GAME_HEIGHT - GROUND_HEIGHT - 1
    state = { ...state, bird: { ...state.bird, y: groundY, vy: 5 } }
    state = tick(state)
    expect(state.phase).toBe('dead')
  })

  it('increments score when passing a pipe', () => {
    let state = startGame()
    state = {
      ...state,
      pipes: [{ x: 50, gapY: GAME_HEIGHT / 2, scored: false, passFlash: 0 }],
      bird: { ...state.bird, x: 120, y: GAME_HEIGHT / 2, vy: 0, rotation: 0 },
    }
    state = tick(state, 2)
    expect(state.score).toBe(1)
    expect(state.pipes[0]?.scored).toBe(true)
  })

  it('assigns medals at score thresholds', () => {
    expect(getMedal(0)).toBe('none')
    expect(getMedal(10)).toBe('amber')
    expect(getMedal(25)).toBe('emerald')
    expect(getMedal(50)).toBe('blue')
  })

  it('restart from dead via flap', () => {
    let state = startGame()
    state = { ...state, phase: 'dead', score: 5 }
    const restarted = flap(state)
    expect(restarted.phase).toBe('playing')
    expect(restarted.score).toBe(0)
  })

  it('decays screen shake and milestone flash on tick', () => {
    let state = startGame()
    state = { ...state, screenShake: 5, milestoneFlash: 0.5 }
    state = tick(state, 1)
    expect(state.screenShake).toBeLessThan(5)
    expect(state.milestoneFlash).toBeLessThan(0.5)
  })

  it('spawns new pipe when pipeSpawnTimer reaches nextPipeInterval', () => {
    let state = startGame()
    state = { ...state, pipeSpawnTimer: 104, nextPipeInterval: 105, pipes: [] }
    state = tick(state, 2)
    expect(state.pipes.length).toBe(1)
    expect(state.pipes[0]?.x).toBe(state.gameWidth)
    expect(state.pipeSpawnTimer).toBe(0)
  })

  it('preserves custom gameWidth across initial and started states', () => {
    const wideState = createInitialState(540)
    expect(wideState.gameWidth).toBe(540)
    const started = startGame(540)
    expect(started.gameWidth).toBe(540)
  })

  it('shouldSimulateGame only when playing on play tab', () => {
    expect(
      shouldSimulateGame('playing', {
        activeTab: 'play',
        isFullscreen: false,
        documentHidden: false,
      }),
    ).toBe(true)
    expect(
      shouldSimulateGame('playing', {
        activeTab: 'leaderboard',
        isFullscreen: false,
        documentHidden: false,
      }),
    ).toBe(false)
    expect(
      shouldSimulateGame('playing', {
        activeTab: 'play',
        isFullscreen: false,
        documentHidden: true,
      }),
    ).toBe(false)
    expect(
      shouldSimulateGame('idle', {
        activeTab: 'play',
        isFullscreen: false,
        documentHidden: false,
      }),
    ).toBe(false)
  })
})

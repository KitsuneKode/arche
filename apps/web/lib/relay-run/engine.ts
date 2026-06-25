export const GAME_WIDTH = 320
export const GAME_HEIGHT = 480
export const GRAVITY = 0.35
export const FLAP_VELOCITY = -6.5
export const PIPE_GAP = 110
export const PIPE_WIDTH = 52
export const PIPE_SPEED = 2.2
export const PIPE_INTERVAL = 90
export const BIRD_SIZE = 22

export type Bird = { x: number; y: number; vy: number }
export type Pipe = { x: number; gapY: number; scored: boolean }

export type GameState = {
  bird: Bird
  pipes: Pipe[]
  score: number
  frame: number
  alive: boolean
}

export function createInitialState(): GameState {
  return {
    bird: { x: 72, y: GAME_HEIGHT / 2, vy: 0 },
    pipes: [],
    score: 0,
    frame: 0,
    alive: true,
  }
}

export function flap(state: GameState): GameState {
  if (!state.alive) return state
  return { ...state, bird: { ...state.bird, vy: FLAP_VELOCITY } }
}

function birdHitsBounds(bird: Bird): boolean {
  return bird.y <= 0 || bird.y + BIRD_SIZE >= GAME_HEIGHT
}

function birdHitsPipe(bird: Bird, pipe: Pipe): boolean {
  const inX = bird.x + BIRD_SIZE > pipe.x && bird.x < pipe.x + PIPE_WIDTH
  if (!inX) return false
  const topBottom = pipe.gapY - PIPE_GAP / 2
  const bottomTop = pipe.gapY + PIPE_GAP / 2
  return bird.y < topBottom || bird.y + BIRD_SIZE > bottomTop
}

export function tick(state: GameState): GameState {
  if (!state.alive) return state

  const frame = state.frame + 1
  let pipes = state.pipes.map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0)

  if (frame % PIPE_INTERVAL === 0) {
    const gapY = 80 + Math.random() * (GAME_HEIGHT - 160)
    pipes.push({ x: GAME_WIDTH, gapY, scored: false })
  }

  const bird = {
    ...state.bird,
    vy: state.bird.vy + GRAVITY,
    y: state.bird.y + state.bird.vy,
  }

  let score = state.score
  for (const pipe of pipes) {
    if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.scored = true
      score += 1
    }
  }

  const hit = birdHitsBounds(bird) || pipes.some((pipe) => birdHitsPipe(bird, pipe))
  return {
    bird,
    pipes,
    score,
    frame,
    alive: !hit,
  }
}

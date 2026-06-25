export const GAME_WIDTH = 320
export const GAME_HEIGHT = 480
export const GRAVITY = 0.35
export const FLAP_VELOCITY = -6.5
export const PIPE_GAP = 110
export const PIPE_WIDTH = 52
export const PIPE_CAP_HEIGHT = 14
/** Horizontal overhang of pipe cap beyond body (each side). */
export const PIPE_CAP_OVERHANG = 3
export const BASE_PIPE_SPEED = 2.2
export const MAX_PIPE_SPEED = 3.5
export const PIPE_SPEED_RAMP_EVERY = 5
export const PIPE_INTERVAL = 90
export const BIRD_SIZE = 22
export const GROUND_HEIGHT = 48

export type GamePhase = 'idle' | 'playing' | 'dead'
export type MedalTier = 'none' | 'amber' | 'emerald' | 'blue'

export type Bird = { x: number; y: number; vy: number; rotation: number }
export type Pipe = { x: number; gapY: number; scored: boolean; passFlash: number; gapSize: number }

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  decay: number
  gravity?: number
  bounce?: boolean
  angle?: number
  spin?: number
  shape?: 'circle' | 'square' | 'line'
}

export type FloatingText = {
  x: number
  y: number
  text: string
  life: number
  color: string
}

export type GameState = {
  phase: GamePhase
  gameWidth: number
  bird: Bird
  pipes: Pipe[]
  score: number
  frame: number
  pipeSpawnTimer: number
  nextPipeInterval: number
  scrollOffset: number
  speed: number
  visualFrame: number
  particles: Particle[]
  floatingTexts: FloatingText[]
  screenShake: number
  milestoneFlash: number
}

function playfieldBottom(): number {
  return GAME_HEIGHT - GROUND_HEIGHT
}

function pipeSpeedForScore(score: number): number {
  const ramp = Math.floor(score / PIPE_SPEED_RAMP_EVERY) * 0.15
  return Math.min(MAX_PIPE_SPEED, BASE_PIPE_SPEED + ramp)
}

function rotationForVelocity(vy: number): number {
  return Math.max(-0.45, Math.min(0.9, vy * 0.06))
}

export function getMedal(score: number): MedalTier {
  if (score >= 50) return 'blue'
  if (score >= 25) return 'emerald'
  if (score >= 10) return 'amber'
  return 'none'
}

export function getPipeParametersForScore(score: number): {
  gap: number
  interval: number
} {
  // Probabilistic difficulty parameters
  if (score < 3) {
    // Stage 1: Extremely easy intro gap (135px), wide spacing
    return { gap: 135, interval: 105 }
  } else if (score < 8) {
    // Stage 2: Gentle sizing, spacing decreases slightly
    const gap = 118 + Math.random() * 8
    const interval = 95 + Math.random() * 10
    return { gap, interval }
  } else {
    // Stage 3: Variable, slot-machine style difficulty variance
    const rand = Math.random()
    let gap = 110
    if (score < 20) {
      if (rand < 0.2)
        gap = 100 // tight gap
      else if (rand < 0.8)
        gap = 112 // normal gap
      else gap = 125 // breather gap
    } else {
      // Score >= 20: Advanced difficulty
      if (rand < 0.3)
        gap = 92 // extremely tight
      else if (rand < 0.7)
        gap = 105 // tight
      else if (rand < 0.9)
        gap = 112 // normal
      else gap = 120 // breather
    }

    const intRand = Math.random()
    let interval = 90
    if (score >= 15) {
      if (intRand < 0.25)
        interval = 78 // fast-succession double pipes!
      else if (intRand < 0.75)
        interval = 90 // standard
      else interval = 105 // relaxed spacing
    }

    return { gap, interval }
  }
}

export function createInitialState(gameWidth = 320): GameState {
  return {
    phase: 'idle',
    gameWidth,
    bird: { x: 72, y: GAME_HEIGHT / 2 - GROUND_HEIGHT / 2, vy: 0, rotation: 0 },
    pipes: [],
    score: 0,
    frame: 0,
    pipeSpawnTimer: 0,
    nextPipeInterval: 105,
    scrollOffset: 0,
    speed: BASE_PIPE_SPEED,
    visualFrame: 0,
    particles: [],
    floatingTexts: [],
    screenShake: 0,
    milestoneFlash: 0,
  }
}

export function startGame(gameWidth = 320): GameState {
  return {
    ...createInitialState(gameWidth),
    phase: 'playing',
  }
}

export function resetGame(gameWidth = 320): GameState {
  return createInitialState(gameWidth)
}

export function flap(state: GameState): GameState {
  if (state.phase === 'idle' || state.phase === 'dead') {
    const started = startGame(state.gameWidth)
    const vy = FLAP_VELOCITY
    const initialParticles = [...started.particles]
    for (let i = 0; i < 8; i++) {
      initialParticles.push({
        x: started.bird.x - 2,
        y: started.bird.y + BIRD_SIZE / 2,
        vx: -started.speed - 2 - Math.random() * 3,
        vy: (Math.random() - 0.5) * 3,
        color: '#fbbf24',
        size: 2 + Math.random() * 2,
        life: 1.0,
        decay: 0.05 + Math.random() * 0.05,
      })
    }
    return {
      ...started,
      bird: {
        ...started.bird,
        vy,
        rotation: rotationForVelocity(vy),
      },
      particles: initialParticles,
    }
  }

  if (state.phase !== 'playing') return state

  const vy = FLAP_VELOCITY
  const particles = [...(state.particles || [])]
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: state.bird.x - 2,
      y: state.bird.y + BIRD_SIZE / 2,
      vx: -state.speed - 2 - Math.random() * 3,
      vy: (Math.random() - 0.5) * 3,
      color: '#fbbf24',
      size: 2 + Math.random() * 2,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.05,
    })
  }

  return {
    ...state,
    bird: {
      ...state.bird,
      vy,
      rotation: rotationForVelocity(vy),
    },
    particles,
  }
}

function birdHitsCeiling(bird: Bird): boolean {
  return bird.y <= 0
}

function birdHitsGround(bird: Bird): boolean {
  return bird.y + BIRD_SIZE >= playfieldBottom()
}

function birdHitsPipe(bird: Bird, pipe: Pipe): boolean {
  const pipeLeft = pipe.x - PIPE_CAP_OVERHANG
  const pipeRight = pipe.x + PIPE_WIDTH + PIPE_CAP_OVERHANG
  const inX = bird.x + BIRD_SIZE > pipeLeft && bird.x < pipeRight
  if (!inX) return false
  const gapSize = pipe.gapSize ?? PIPE_GAP
  const topBottom = pipe.gapY - gapSize / 2
  const bottomTop = pipe.gapY + gapSize / 2
  return bird.y < topBottom || bird.y + BIRD_SIZE > bottomTop
}

export function tick(state: GameState, dt = 1): GameState {
  const step = Math.min(Math.max(dt, 0), 2)
  const visualFrame = state.visualFrame + 1

  // Handle particle updates in all phases
  const particles: Particle[] = (state.particles || [])
    .map((p): Particle => {
      let vx = p.vx
      let vy = p.vy
      let x = p.x
      let y = p.y
      if (p.gravity) {
        vy += p.gravity * step
      }
      x += vx * step
      y += vy * step

      const groundY = playfieldBottom()
      if (p.bounce && y + p.size > groundY) {
        y = groundY - p.size
        vy = -vy * 0.4
        vx *= 0.8
      }

      return {
        ...p,
        x,
        y,
        vx,
        vy,
        life: p.life - p.decay * step,
        angle: p.angle !== undefined && p.spin !== undefined ? p.angle + p.spin * step : p.angle,
      }
    })
    .filter((p) => p.life > 0)

  // Handle floating text updates in all phases
  const floatingTexts = (state.floatingTexts || [])
    .map((t) => ({
      ...t,
      y: t.y - 0.8 * step,
      life: t.life - 0.04 * step,
    }))
    .filter((t) => t.life > 0)

  // Handle screen shake decay
  const screenShake = Math.max(0, (state.screenShake || 0) - 0.4 * step)
  const milestoneFlash = Math.max(0, (state.milestoneFlash || 0) - 0.08 * step)

  if (state.phase === 'idle') {
    const speed = 0.5
    const scrollOffset = state.scrollOffset + speed * step
    return {
      ...state,
      visualFrame,
      scrollOffset,
      particles,
      floatingTexts,
      screenShake,
      milestoneFlash,
    }
  }

  if (state.phase === 'dead') {
    let bird = state.bird
    const groundY = playfieldBottom()
    if (bird.y + BIRD_SIZE < groundY) {
      const vy = bird.vy + GRAVITY * step
      bird = {
        ...bird,
        vy,
        y: Math.min(groundY - BIRD_SIZE, bird.y + vy * step),
        rotation: rotationForVelocity(vy),
      }
    }
    return {
      ...state,
      bird,
      visualFrame,
      particles,
      floatingTexts,
      screenShake,
      milestoneFlash,
    }
  }

  const frame = state.frame + 1
  const speed = pipeSpeedForScore(state.score)
  const scrollOffset = state.scrollOffset + speed * step

  // Spawn exhaust particles
  if (Math.random() < 0.4) {
    particles.push({
      x: state.bird.x - 2,
      y: state.bird.y + BIRD_SIZE / 2 + (Math.random() - 0.5) * 6,
      vx: -speed - 0.5 - Math.random() * 1.5,
      vy: (Math.random() - 0.5) * 0.8,
      color: Math.random() > 0.5 ? '#fbbf24' : '#71717a',
      size: 1.5 + Math.random() * 2,
      life: 1.0,
      decay: 0.04 + Math.random() * 0.03,
    })
  }

  let pipeSpawnTimer = state.pipeSpawnTimer + step
  let pipes = state.pipes.map((pipe) => ({
    ...pipe,
    x: pipe.x - speed * step,
    passFlash: pipe.passFlash > 0 ? Math.max(0, pipe.passFlash - step) : 0,
  }))
  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH + PIPE_CAP_OVERHANG > 0)

  let nextPipeInterval = state.nextPipeInterval
  if (pipeSpawnTimer >= state.nextPipeInterval) {
    pipeSpawnTimer = 0
    const { gap: gapSize, interval: nextInterval } = getPipeParametersForScore(state.score)
    nextPipeInterval = nextInterval

    const minGap = 80 + gapSize / 2
    const maxGap = playfieldBottom() - 80 - gapSize / 2
    const gapY = minGap + Math.random() * (maxGap - minGap)

    pipes.push({ x: state.gameWidth, gapY, scored: false, passFlash: 0, gapSize })
  }

  const vy = state.bird.vy + GRAVITY * step
  const bird: Bird = {
    ...state.bird,
    vy,
    y: state.bird.y + vy * step,
    rotation: rotationForVelocity(vy),
  }

  let score = state.score
  let newMilestoneFlash = milestoneFlash
  for (const pipe of pipes) {
    if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.scored = true
      pipe.passFlash = 3
      score += 1

      floatingTexts.push({
        x: pipe.x + PIPE_WIDTH / 2,
        y: pipe.gapY - 10,
        text: '+1',
        life: 1.0,
        color: '#34d399',
      })

      for (let i = 0; i < 6; i++) {
        particles.push({
          x: pipe.x + PIPE_WIDTH / 2,
          y: pipe.gapY + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          color: '#34d399',
          size: 2 + Math.random() * 2,
          life: 1.0,
          decay: 0.05 + Math.random() * 0.05,
        })
      }

      const isMilestone = score === 10 || score === 25 || score === 50
      const isMultipleOf10 = score > 0 && score % 10 === 0
      if (isMilestone || isMultipleOf10) {
        newMilestoneFlash = 0.6
        for (let i = 0; i < 45; i++) {
          particles.push({
            x: state.gameWidth / 2 + (Math.random() - 0.5) * 60,
            y: GAME_HEIGHT / 4 + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 5,
            vy: -2 - Math.random() * 5,
            color: ['#fbbf24', '#34d399', '#60a5fa', '#a1a1aa', '#fde68a'][
              Math.floor(Math.random() * 5)
            ]!,
            size: 3 + Math.random() * 4,
            life: 1.0,
            decay: 0.008 + Math.random() * 0.008,
            gravity: 0.15,
            bounce: true,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.15,
            shape: Math.random() > 0.5 ? 'square' : 'circle',
          })
        }
      }
    }
  }

  const hit =
    birdHitsCeiling(bird) || birdHitsGround(bird) || pipes.some((pipe) => birdHitsPipe(bird, pipe))

  if (hit) {
    const crashParticles = [...particles]
    for (let i = 0; i < 20; i++) {
      crashParticles.push({
        x: bird.x + BIRD_SIZE / 2,
        y: bird.y + BIRD_SIZE / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: Math.random() > 0.5 ? '#f87171' : '#fbbf24',
        size: 3 + Math.random() * 4,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        gravity: 0.1,
      })
    }
    return {
      ...state,
      bird,
      pipes,
      score,
      frame,
      pipeSpawnTimer,
      nextPipeInterval,
      scrollOffset,
      speed,
      visualFrame,
      phase: 'dead',
      particles: crashParticles,
      floatingTexts,
      screenShake: 8.0,
      milestoneFlash: newMilestoneFlash,
    }
  }

  return {
    ...state,
    bird,
    pipes,
    score,
    frame,
    pipeSpawnTimer,
    nextPipeInterval,
    scrollOffset,
    speed,
    visualFrame,
    particles,
    floatingTexts,
    screenShake,
    milestoneFlash: newMilestoneFlash,
  }
}

export function incrementVisualFrame(state: GameState): GameState {
  return { ...state, visualFrame: state.visualFrame + 1 }
}

export function shouldSimulateGame(
  phase: GamePhase,
  options: { activeTab: string; isFullscreen: boolean; documentHidden: boolean },
): boolean {
  if (phase !== 'playing') return false
  if (options.documentHidden) return false
  return options.isFullscreen || options.activeTab === 'play'
}

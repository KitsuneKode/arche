import { PIPE_CAP_HEIGHT, PIPE_WIDTH } from './engine'

export type BakedSprite = {
  canvas: HTMLCanvasElement
  width: number
  height: number
}

export type GameSprites = {
  birdFrameA: BakedSprite
  birdFrameB: BakedSprite
  pipeBody: BakedSprite
  pipeCap: BakedSprite
  groundTile: BakedSprite
  gridTile: BakedSprite
}

/** Arche live-panel palette — zinc structure, amber accent, emerald score flash */
const COLORS = {
  bgTop: '#0c0c0f',
  bgMid: '#141418',
  bgBottom: '#050505',
  border: 'rgba(39, 39, 42, 0.45)',
  pipeBody: '#18181b',
  pipeBodyEdge: '#27272a',
  pipeCap: '#27272a',
  pipeCapAccent: '#3f3f46',
  amber: '#fcd34d',
  amberDark: '#f59e0b',
  amberLight: '#fef3c7',
  amberGlow: 'rgba(251, 191, 36, 0.14)',
  emerald: '#34d399',
  emeraldGlow: 'rgba(52, 211, 153, 0.18)',
  blue: '#60a5fa',
  blueMuted: 'rgba(96, 165, 250, 0.35)',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc600: '#52525b',
  zinc700: '#3f3f46',
  zinc800: '#27272a',
  foreground: '#fafafa',
  ground: '#09090b',
  groundLine: '#27272a',
  pipeHighlight: 'rgba(250, 250, 250, 0.06)',
  pipeStackLine: 'rgba(39, 39, 42, 0.9)',
} as const

export type ThemeColors = typeof COLORS

export function getThemeColors(): ThemeColors {
  return COLORS
}

const SPRITE_SCALE = 4

function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    return {
      width: width * SPRITE_SCALE,
      height: height * SPRITE_SCALE,
      getContext: () => null,
    } as unknown as HTMLCanvasElement
  }
  const canvas = document.createElement('canvas')
  canvas.width = width * SPRITE_SCALE
  canvas.height = height * SPRITE_SCALE
  return canvas
}

function bakeBird(frame: 'a' | 'b'): BakedSprite {
  const width = 32
  const height = 24
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { canvas, width, height }
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE)

  ctx.clearRect(0, 0, width, height)

  const wingLift = frame === 'a' ? -2 : 2
  const noseX = 27
  const tailX = 4

  // Soft amber bloom — keeps ship readable on dark grid
  ctx.fillStyle = COLORS.amberGlow
  ctx.beginPath()
  ctx.ellipse(16, 12, 13, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Rear stabilizers
  ctx.fillStyle = COLORS.zinc700
  ctx.beginPath()
  ctx.moveTo(tailX, 11)
  ctx.lineTo(tailX - 2, 8 + wingLift * 0.25)
  ctx.lineTo(tailX + 3, 10)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(tailX, 13)
  ctx.lineTo(tailX - 2, 16 - wingLift * 0.25)
  ctx.lineTo(tailX + 3, 14)
  ctx.closePath()
  ctx.fill()

  // Main wing — flaps between frames
  ctx.fillStyle = COLORS.zinc600
  ctx.beginPath()
  ctx.moveTo(12, 12)
  ctx.lineTo(6, 6 + wingLift)
  ctx.lineTo(18, 11 + wingLift * 0.35)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(12, 12)
  ctx.lineTo(6, 18 - wingLift)
  ctx.lineTo(18, 13 - wingLift * 0.35)
  ctx.closePath()
  ctx.fill()

  // Hull body
  ctx.fillStyle = COLORS.zinc700
  ctx.beginPath()
  ctx.moveTo(tailX + 1, 9)
  ctx.lineTo(noseX - 6, 8)
  ctx.lineTo(noseX, 12)
  ctx.lineTo(noseX - 6, 16)
  ctx.lineTo(tailX + 1, 15)
  ctx.closePath()
  ctx.fill()

  // Amber relay spine
  ctx.fillStyle = COLORS.amberDark
  ctx.beginPath()
  ctx.moveTo(tailX + 4, 11.5)
  ctx.lineTo(noseX - 4, 10.5)
  ctx.lineTo(noseX - 1, 12)
  ctx.lineTo(noseX - 4, 13.5)
  ctx.lineTo(tailX + 4, 12.5)
  ctx.closePath()
  ctx.fill()

  // Cockpit canopy — bright read at small scale
  ctx.fillStyle = COLORS.amberLight
  ctx.beginPath()
  ctx.moveTo(14, 9)
  ctx.lineTo(21, 8.5)
  ctx.lineTo(22, 11)
  ctx.lineTo(16, 11.5)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(250, 250, 250, 0.85)'
  ctx.fillRect(15, 9.5, 4, 1.5)

  // Nose beacon
  ctx.fillStyle = COLORS.amber
  ctx.beginPath()
  ctx.moveTo(noseX - 2, 11)
  ctx.lineTo(noseX + 1, 12)
  ctx.lineTo(noseX - 2, 13)
  ctx.closePath()
  ctx.fill()

  // Hull edge highlights
  ctx.strokeStyle = COLORS.zinc800
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(tailX + 1, 9)
  ctx.lineTo(noseX - 6, 8)
  ctx.lineTo(noseX, 12)
  ctx.lineTo(noseX - 6, 16)
  ctx.lineTo(tailX + 1, 15)
  ctx.closePath()
  ctx.stroke()

  ctx.strokeStyle = COLORS.amberLight
  ctx.lineWidth = 0.75
  ctx.beginPath()
  ctx.moveTo(14, 9)
  ctx.lineTo(21, 8.5)
  ctx.stroke()

  // Relay nodes on wings
  ctx.fillStyle = frame === 'a' ? COLORS.amberLight : COLORS.amber
  ctx.fillRect(9, 10 + wingLift * 0.4, 2, 2)
  ctx.fillRect(9, 12 - wingLift * 0.4, 2, 2)

  // Engine ports (left) — pairs with runtime exhaust in renderer
  ctx.fillStyle = COLORS.zinc500
  ctx.fillRect(tailX, 10.5, 2, 1.5)
  ctx.fillRect(tailX, 12, 2, 1.5)
  if (frame === 'b') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.55)'
    ctx.fillRect(tailX - 2, 11, 2, 2)
  }

  return { canvas, width, height }
}

function bakePipeBody(): BakedSprite {
  const width = PIPE_WIDTH
  const height = 32
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { canvas, width, height }
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE)

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = COLORS.pipeBody
  ctx.fillRect(0, 0, width, height)

  // Stack layers — zinc rack aesthetic
  ctx.strokeStyle = COLORS.pipeStackLine
  ctx.lineWidth = 1
  for (let y = 6; y < height; y += 8) {
    ctx.beginPath()
    ctx.moveTo(1, y)
    ctx.lineTo(width - 1, y)
    ctx.stroke()
  }

  // Side rails
  ctx.strokeStyle = COLORS.pipeBodyEdge
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

  // Left edge highlight
  ctx.fillStyle = COLORS.pipeHighlight
  ctx.fillRect(1, 0, 2, height)

  return { canvas, width, height }
}

function bakePipeCap(): BakedSprite {
  const width = PIPE_WIDTH + 6
  const height = PIPE_CAP_HEIGHT
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { canvas, width, height }
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE)

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = COLORS.pipeCap
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = COLORS.pipeBodyEdge
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

  // Connector lip
  ctx.fillStyle = COLORS.pipeCapAccent
  ctx.fillRect(2, height - 3, width - 4, 2)

  // Amber relay pin — subtle accent only
  ctx.fillStyle = COLORS.amber
  ctx.fillRect(width / 2 - 3, height / 2 - 0.5, 6, 1)

  return { canvas, width, height }
}

function bakeGroundTile(): BakedSprite {
  const width = 64
  const height = 48
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { canvas, width, height }
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE)

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = COLORS.ground
  ctx.fillRect(0, 0, width, height)

  // Top seam — zinc structure line
  ctx.strokeStyle = COLORS.groundLine
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 0.5)
  ctx.lineTo(width, 0.5)
  ctx.stroke()

  // Quiet perspective grid
  ctx.strokeStyle = 'rgba(39, 39, 42, 0.35)'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 16) {
    ctx.beginPath()
    ctx.moveTo(x, 2)
    ctx.lineTo(x + 3, height - 2)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(63, 63, 70, 0.25)'
  ctx.beginPath()
  ctx.moveTo(0, 18)
  ctx.lineTo(width, 18)
  ctx.moveTo(0, 34)
  ctx.lineTo(width, 34)
  ctx.stroke()

  return { canvas, width, height }
}

function bakeGridTile(): BakedSprite {
  const width = 28
  const height = 28
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { canvas, width, height }
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE)

  ctx.clearRect(0, 0, width, height)

  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width, 0)
  ctx.lineTo(width, height)
  ctx.moveTo(0, height)
  ctx.lineTo(width, height)
  ctx.stroke()

  ctx.fillStyle = 'rgba(113, 113, 122, 0.12)'
  ctx.fillRect(width - 1, height - 1, 1, 1)

  return { canvas, width, height }
}

let cachedSprites: GameSprites | null = null

export function createThemedSprites(): GameSprites {
  if (cachedSprites) return cachedSprites
  cachedSprites = {
    birdFrameA: bakeBird('a'),
    birdFrameB: bakeBird('b'),
    pipeBody: bakePipeBody(),
    pipeCap: bakePipeCap(),
    groundTile: bakeGroundTile(),
    gridTile: bakeGridTile(),
  }
  return cachedSprites
}

export function invalidateSpriteCache(): void {
  cachedSprites = null
}

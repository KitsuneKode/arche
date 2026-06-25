import {
  BIRD_SIZE,
  GAME_HEIGHT,
  GROUND_HEIGHT,
  PIPE_GAP,
  PIPE_WIDTH,
  type GameState,
} from './engine'
import { type GameSprites, getThemeColors } from './sprites'

export type RenderOptions = {
  reducedMotion?: boolean
}

let cachedGradient: CanvasGradient | null = null
let cachedGradientCtx: CanvasRenderingContext2D | null = null

function getBackgroundGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (cachedGradient && cachedGradientCtx === ctx) return cachedGradient
  const colors = getThemeColors()
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  gradient.addColorStop(0, colors.bgTop)
  gradient.addColorStop(0.38, colors.bgMid)
  gradient.addColorStop(0.62, colors.bgMid)
  gradient.addColorStop(1, colors.bgBottom)
  cachedGradient = gradient
  cachedGradientCtx = ctx
  return gradient
}

function drawPlayfieldLift(ctx: CanvasRenderingContext2D, width: number) {
  const colors = getThemeColors()
  const birdLaneX = Math.min(width * 0.22, 96)
  const birdLaneY = GAME_HEIGHT * 0.44

  ctx.save()
  const lift = ctx.createRadialGradient(
    birdLaneX,
    birdLaneY,
    24,
    birdLaneX,
    birdLaneY,
    GAME_HEIGHT * 0.52,
  )
  lift.addColorStop(0, 'rgba(82, 82, 91, 0.22)')
  lift.addColorStop(0.55, 'rgba(39, 39, 42, 0.08)')
  lift.addColorStop(1, 'rgba(9, 9, 11, 0)')
  ctx.fillStyle = lift
  ctx.fillRect(0, 0, width, GAME_HEIGHT - GROUND_HEIGHT)

  const column = ctx.createLinearGradient(birdLaneX - 48, 0, birdLaneX + 120, 0)
  column.addColorStop(0, 'rgba(9, 9, 11, 0)')
  column.addColorStop(0.35, 'rgba(63, 63, 70, 0.12)')
  column.addColorStop(0.7, 'rgba(9, 9, 11, 0)')
  ctx.fillStyle = column
  ctx.fillRect(0, 0, width, GAME_HEIGHT - GROUND_HEIGHT)

  ctx.strokeStyle = colors.blueMuted
  ctx.globalAlpha = 0.04
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(birdLaneX, 28)
  ctx.lineTo(birdLaneX, GAME_HEIGHT - GROUND_HEIGHT - 28)
  ctx.stroke()
  ctx.restore()
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  sprites: GameSprites,
  reducedMotion: boolean,
) {
  ctx.fillStyle = getBackgroundGradient(ctx)
  ctx.fillRect(0, 0, state.gameWidth, GAME_HEIGHT)
  drawPlayfieldLift(ctx, state.gameWidth)

  const gridW = sprites.gridTile.width
  const gridH = sprites.gridTile.height
  const layer1 = reducedMotion ? 0 : state.scrollOffset * 0.3
  const layer2 = reducedMotion ? 0 : state.scrollOffset * 0.6

  for (let x = -gridW; x < state.gameWidth + gridW; x += gridW) {
    for (let y = -gridH; y < GAME_HEIGHT - GROUND_HEIGHT + gridH; y += gridH) {
      const drawX = x - (layer1 % gridW)
      const drawY = y - (layer1 % gridH)
      ctx.drawImage(sprites.gridTile.canvas, drawX, drawY, gridW, gridH)
    }
  }

  if (!reducedMotion) {
    const colors = getThemeColors()
    ctx.strokeStyle = colors.blueMuted
    ctx.globalAlpha = 0.06
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      const streakX = ((state.visualFrame * 1.2 + i * 110 - layer2) % (state.gameWidth + 80)) - 40
      const streakY = 60 + i * 90
      ctx.beginPath()
      ctx.moveTo(streakX, streakY)
      ctx.lineTo(streakX + 24, streakY - 5)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}

function drawGround(ctx: CanvasRenderingContext2D, state: GameState, sprites: GameSprites) {
  const tileW = sprites.groundTile.width
  const tileH = sprites.groundTile.height
  const groundY = GAME_HEIGHT - GROUND_HEIGHT
  const offset = state.scrollOffset % tileW

  for (let x = -tileW; x < state.gameWidth + tileW; x += tileW) {
    ctx.drawImage(sprites.groundTile.canvas, x - offset, groundY, tileW, tileH)
  }
}

function drawPipeColumn(
  ctx: CanvasRenderingContext2D,
  sprites: GameSprites,
  x: number,
  gapY: number,
  gapSize: number,
  passFlash: number,
  reducedMotion: boolean,
) {
  const colors = getThemeColors()
  const topBottom = gapY - gapSize / 2
  const bottomTop = gapY + gapSize / 2
  const capW = sprites.pipeCap.width
  const capH = sprites.pipeCap.height
  const bodyH = sprites.pipeBody.height
  const capX = x - (capW - PIPE_WIDTH) / 2

  if (passFlash > 0 && !reducedMotion) {
    ctx.save()
    ctx.globalAlpha = 0.12 * Math.min(passFlash / 3, 1)
    ctx.fillStyle = colors.emerald
    ctx.fillRect(x - 2, 0, PIPE_WIDTH + 4, topBottom + capH)
    ctx.fillRect(x - 2, bottomTop - capH, PIPE_WIDTH + 4, GAME_HEIGHT)
    ctx.restore()
  }

  ctx.drawImage(sprites.pipeCap.canvas, capX, topBottom - capH, capW, capH)
  for (let y = topBottom - capH - bodyH; y > -bodyH; y -= bodyH) {
    ctx.drawImage(sprites.pipeBody.canvas, x, y, sprites.pipeBody.width, sprites.pipeBody.height)
  }

  ctx.drawImage(sprites.pipeCap.canvas, capX, bottomTop, capW, capH)
  for (let y = bottomTop + capH; y < GAME_HEIGHT - GROUND_HEIGHT; y += bodyH) {
    ctx.drawImage(sprites.pipeBody.canvas, x, y, sprites.pipeBody.width, sprites.pipeBody.height)
  }
}

function drawBoundaryGlows(ctx: CanvasRenderingContext2D, width: number) {
  const colors = getThemeColors()
  ctx.save()

  const topGlow = ctx.createLinearGradient(0, 0, 0, 12)
  topGlow.addColorStop(0, 'rgba(39, 39, 42, 0.35)')
  topGlow.addColorStop(1, 'rgba(9, 9, 11, 0)')
  ctx.fillStyle = topGlow
  ctx.fillRect(0, 0, width, 12)

  const bottomY = GAME_HEIGHT - GROUND_HEIGHT
  const bottomGlow = ctx.createLinearGradient(0, bottomY, 0, bottomY - 16)
  bottomGlow.addColorStop(0, 'rgba(39, 39, 42, 0.3)')
  bottomGlow.addColorStop(1, 'rgba(9, 9, 11, 0)')
  ctx.fillStyle = bottomGlow
  ctx.fillRect(0, bottomY - 16, width, 16)

  ctx.strokeStyle = colors.border
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(0, 0.5)
  ctx.lineTo(width, 0.5)
  ctx.stroke()
  ctx.restore()
}

function drawVignette(ctx: CanvasRenderingContext2D, width: number) {
  ctx.save()

  const top = ctx.createLinearGradient(0, 0, 0, 48)
  top.addColorStop(0, 'rgba(5, 5, 5, 0.42)')
  top.addColorStop(1, 'rgba(5, 5, 5, 0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, width, 48)

  const bottomY = GAME_HEIGHT - GROUND_HEIGHT
  const bottom = ctx.createLinearGradient(0, bottomY - 56, 0, bottomY)
  bottom.addColorStop(0, 'rgba(5, 5, 5, 0)')
  bottom.addColorStop(1, 'rgba(5, 5, 5, 0.38)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, bottomY - 56, width, 56)

  const left = ctx.createLinearGradient(0, 0, 72, 0)
  left.addColorStop(0, 'rgba(5, 5, 5, 0.28)')
  left.addColorStop(1, 'rgba(5, 5, 5, 0)')
  ctx.fillStyle = left
  ctx.fillRect(0, 0, 72, GAME_HEIGHT - GROUND_HEIGHT)

  const right = ctx.createLinearGradient(width, 0, width - 96, 0)
  right.addColorStop(0, 'rgba(5, 5, 5, 0.45)')
  right.addColorStop(1, 'rgba(5, 5, 5, 0)')
  ctx.fillStyle = right
  ctx.fillRect(width - 96, 0, 96, GAME_HEIGHT - GROUND_HEIGHT)

  ctx.restore()
}

function drawBird(ctx: CanvasRenderingContext2D, state: GameState, sprites: GameSprites) {
  const colors = getThemeColors()
  const frame = state.frame % 12 < 6 ? sprites.birdFrameA : sprites.birdFrameB
  const { bird } = state

  let yOffset = 0
  if (state.phase === 'idle') {
    yOffset = Math.sin(state.visualFrame * 0.06) * 3
  }

  const cx = bird.x + BIRD_SIZE / 2
  const cy = bird.y + BIRD_SIZE / 2 + yOffset

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(state.phase === 'idle' ? Math.sin(state.visualFrame * 0.04) * 0.08 : bird.rotation)

  if (state.phase === 'playing') {
    const isFlapping = bird.vy < 0
    const flameLen = isFlapping
      ? 12 + Math.sin(state.visualFrame * 0.4) * 4
      : 7 + Math.sin(state.visualFrame * 0.3) * 2
    const flameW = isFlapping
      ? 6 + Math.sin(state.visualFrame * 0.5) * 1.5
      : 4 + Math.sin(state.visualFrame * 0.4) * 1

    ctx.save()
    ctx.translate(-18, 1)
    ctx.fillStyle = isFlapping ? colors.amber : colors.zinc500
    ctx.globalAlpha = isFlapping ? 0.9 : 0.55
    ctx.beginPath()
    ctx.moveTo(0, -flameW / 2)
    ctx.lineTo(-flameLen, 0)
    ctx.lineTo(0, flameW / 2)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  if (bird.vy < -2 && state.phase === 'playing') {
    ctx.globalAlpha = 0.1
    ctx.translate(-6, 0)
    ctx.drawImage(frame.canvas, -frame.width / 2, -frame.height / 2, frame.width, frame.height)
    ctx.translate(6, 0)
    ctx.globalAlpha = 0.2
    ctx.translate(-3, 0)
    ctx.drawImage(frame.canvas, -frame.width / 2, -frame.height / 2, frame.width, frame.height)
    ctx.translate(3, 0)
    ctx.globalAlpha = 1
  }

  ctx.drawImage(frame.canvas, -frame.width / 2, -frame.height / 2, frame.width, frame.height)
  ctx.restore()
}

type ParticleDraw = {
  x: number
  y: number
  life: number
  color: string
  size: number
  shape?: string
  angle?: number
}

type FloatingTextDraw = {
  x: number
  y: number
  life: number
  color: string
  text: string
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: ParticleDraw[]) {
  if (!particles) return
  ctx.save()
  for (const p of particles) {
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color

    if (p.shape === 'square') {
      ctx.save()
      ctx.translate(p.x, p.y)
      if (p.angle !== undefined) {
        ctx.rotate(p.angle)
      }
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()
    } else if (p.shape === 'line') {
      ctx.save()
      ctx.translate(p.x, p.y)
      if (p.angle !== undefined) {
        ctx.rotate(p.angle)
      }
      ctx.lineWidth = p.size / 3
      ctx.strokeStyle = p.color
      ctx.beginPath()
      ctx.moveTo(-p.size, 0)
      ctx.lineTo(p.size, 0)
      ctx.stroke()
      ctx.restore()
    } else {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingTextDraw[]) {
  if (!texts) return
  ctx.save()
  ctx.font = '600 11px "Fira Code", ui-monospace, monospace'
  ctx.textAlign = 'center'
  for (const t of texts) {
    ctx.globalAlpha = t.life
    ctx.fillStyle = t.color
    ctx.fillText(t.text, t.x, t.y)
  }
  ctx.restore()
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.phase !== 'playing') return
  const colors = getThemeColors()

  ctx.save()

  const labelX = 10
  const labelY = 10

  ctx.fillStyle = colors.zinc500
  ctx.font = '500 8px "Fira Code", ui-monospace, monospace'
  ctx.textAlign = 'left'
  ctx.fillText('RELAY', labelX, labelY + 8)

  ctx.fillStyle = colors.foreground
  ctx.font = '600 18px "Fira Code", ui-monospace, monospace'
  ctx.fillText(String(state.score).padStart(2, '0'), labelX, labelY + 26)

  ctx.strokeStyle = colors.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(labelX, labelY + 30)
  ctx.lineTo(labelX + 52, labelY + 30)
  ctx.stroke()

  ctx.fillStyle = colors.zinc600
  ctx.font = '500 7px "Fira Code", ui-monospace, monospace'
  ctx.fillText('F full · M mute · P pause · C chat', labelX, GAME_HEIGHT - GROUND_HEIGHT - 10)

  ctx.restore()
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  const colors = getThemeColors()
  const vf = state.visualFrame

  if (state.phase === 'idle') {
    const pulse = 0.45 + 0.55 * Math.sin(vf * 0.05)

    ctx.save()
    ctx.fillStyle = 'rgba(5, 5, 5, 0.72)'
    ctx.fillRect(0, 0, state.gameWidth, GAME_HEIGHT)

    ctx.textAlign = 'center'
    ctx.fillStyle = colors.amber
    ctx.font = '600 11px "Fira Code", ui-monospace, monospace'
    ctx.fillText('GET READY', state.gameWidth / 2, GAME_HEIGHT / 2 - 6)

    ctx.fillStyle = colors.zinc400
    ctx.font = '500 8px "Fira Code", ui-monospace, monospace'
    ctx.globalAlpha = pulse
    ctx.fillText('SPACE · ENTER · TAP', state.gameWidth / 2, GAME_HEIGHT / 2 + 14)

    ctx.restore()
  }

  if (state.phase === 'dead') {
    const deathAnim = Math.min((vf - state.frame) / 12, 1)
    const overlayAlpha = 0.18 * deathAnim

    ctx.save()
    ctx.fillStyle = `rgba(9, 9, 11, ${overlayAlpha})`
    ctx.fillRect(0, 0, state.gameWidth, GAME_HEIGHT)

    const slideY = (1 - deathAnim) * -20

    ctx.globalAlpha = deathAnim
    ctx.textAlign = 'center'

    ctx.fillStyle = colors.zinc400
    ctx.font = '500 9px "Fira Code", ui-monospace, monospace'
    ctx.fillText('RELAY LOST', state.gameWidth / 2, GAME_HEIGHT / 2 - 28 + slideY)

    ctx.fillStyle = colors.foreground
    ctx.font = '600 28px "Fira Code", ui-monospace, monospace'
    ctx.fillText(String(state.score), state.gameWidth / 2, GAME_HEIGHT / 2 + 2 + slideY)

    ctx.strokeStyle = colors.border
    ctx.lineWidth = 1
    const ruleW = 64
    const ruleX = state.gameWidth / 2 - ruleW / 2
    const ruleY = GAME_HEIGHT / 2 + 14 + slideY
    ctx.beginPath()
    ctx.moveTo(ruleX, ruleY)
    ctx.lineTo(ruleX + ruleW, ruleY)
    ctx.stroke()

    ctx.font = '500 8px "Fira Code", ui-monospace, monospace'
    ctx.fillStyle = colors.zinc500
    const retryPulse = 0.5 + 0.5 * Math.sin(vf * 0.08)
    ctx.globalAlpha = deathAnim * retryPulse
    ctx.fillText('TAP TO RETRY', state.gameWidth / 2, GAME_HEIGHT / 2 + 30 + slideY)

    ctx.restore()
  }
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  sprites: GameSprites,
  options: RenderOptions = {},
) {
  const reducedMotion = options.reducedMotion ?? false

  const isShaking = (state.screenShake || 0) > 0 && !reducedMotion
  if (isShaking) {
    ctx.save()
    const dx = (Math.random() - 0.5) * state.screenShake
    const dy = (Math.random() - 0.5) * state.screenShake
    ctx.translate(dx, dy)
  }

  drawBackground(ctx, state, sprites, reducedMotion)

  for (const pipe of state.pipes) {
    drawPipeColumn(
      ctx,
      sprites,
      pipe.x,
      pipe.gapY,
      pipe.gapSize ?? PIPE_GAP,
      pipe.passFlash,
      reducedMotion,
    )
  }

  drawGround(ctx, state, sprites)
  drawBoundaryGlows(ctx, state.gameWidth)
  drawVignette(ctx, state.gameWidth)
  drawBird(ctx, state, sprites)
  drawParticles(ctx, state.particles)
  drawFloatingTexts(ctx, state.floatingTexts)

  drawHud(ctx, state)
  drawOverlay(ctx, state)

  if (state.milestoneFlash > 0 && !reducedMotion) {
    ctx.save()
    ctx.globalAlpha = state.milestoneFlash * 0.2
    ctx.fillStyle = getThemeColors().amberLight
    ctx.fillRect(0, 0, state.gameWidth, GAME_HEIGHT)
    ctx.restore()
  }

  if (isShaking) {
    ctx.restore()
  }
}

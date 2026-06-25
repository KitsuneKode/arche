'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { LivePanelShell } from '@/components/live/live-panel-shell'
import { useLiveRoom } from '@/components/live/live-room-context'
import {
  BIRD_SIZE,
  createInitialState,
  flap,
  GAME_HEIGHT,
  GAME_WIDTH,
  PIPE_GAP,
  PIPE_WIDTH,
  tick,
  type GameState,
} from '@/lib/relay-run/engine'
import { useTRPC } from '@/trpc/client'

function drawFrame(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.strokeStyle = '#27272a'
  ctx.lineWidth = 1
  for (let x = 0; x < GAME_WIDTH; x += 24) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, GAME_HEIGHT)
    ctx.stroke()
  }

  for (const pipe of state.pipes) {
    ctx.fillStyle = '#3f3f46'
    const topH = pipe.gapY - PIPE_GAP / 2
    const bottomY = pipe.gapY + PIPE_GAP / 2
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topH)
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, GAME_HEIGHT - bottomY)
  }

  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(state.bird.x + BIRD_SIZE / 2, state.bird.y + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fafafa'
  ctx.font = 'bold 20px monospace'
  ctx.fillText(String(state.score), 12, 28)

  if (!state.alive) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    ctx.fillStyle = '#fafafa'
    ctx.font = 'bold 16px monospace'
    ctx.fillText('Game over', GAME_WIDTH / 2 - 42, GAME_HEIGHT / 2 - 8)
    ctx.font = '12px monospace'
    ctx.fillText('Space or tap to retry', GAME_WIDTH / 2 - 72, GAME_HEIGHT / 2 + 14)
  }
}

export function RelayRunGame({
  signedIn,
  onSignInClick,
}: {
  signedIn: boolean
  onSignInClick?: () => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { relayChatOpen } = useLiveRoom()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(createInitialState())
  const rafRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [lastScore, setLastScore] = useState(0)
  const [submitNote, setSubmitNote] = useState<string | null>(null)

  const leaderboardQuery = useQuery(trpc.game.leaderboard.queryOptions())
  const myBestQuery = useQuery({
    ...trpc.game.myBest.queryOptions(),
    enabled: signedIn,
  })
  const submitMutation = useMutation(trpc.game.submitScore.mutationOptions())

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawFrame(ctx, stateRef.current)
  }, [])

  const loop = useCallback(() => {
    stateRef.current = tick(stateRef.current)
    render()
    if (!stateRef.current.alive) {
      stopLoop()
      setPhase('over')
      setLastScore(stateRef.current.score)
      return
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [render, stopLoop])

  const startGame = useCallback(() => {
    stateRef.current = createInitialState()
    setPhase('playing')
    setSubmitNote(null)
    stopLoop()
    rafRef.current = requestAnimationFrame(loop)
  }, [loop, stopLoop])

  const handleAction = useCallback(() => {
    if (phase === 'idle' || phase === 'over') {
      startGame()
      return
    }
    stateRef.current = flap(stateRef.current)
    render()
  }, [phase, render, startGame])

  useEffect(() => {
    render()
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        if (relayChatOpen) return
        event.preventDefault()
        handleAction()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      stopLoop()
    }
  }, [handleAction, render, stopLoop, relayChatOpen])

  useEffect(() => {
    if (phase !== 'over' || !signedIn || lastScore < 1) return
    const best = myBestQuery.data?.score
    if (best !== undefined && lastScore <= best) {
      setSubmitNote(`Best: ${best}`)
      return
    }
    void submitMutation
      .mutateAsync({ score: lastScore })
      .then((result) => {
        setSubmitNote(result.rank ? `Saved — rank #${result.rank}` : `Saved — ${result.score} pts`)
        void queryClient.invalidateQueries({ queryKey: trpc.game.leaderboard.queryKey() })
        void queryClient.invalidateQueries({ queryKey: trpc.game.myBest.queryKey() })
      })
      .catch((error: unknown) => {
        setSubmitNote(error instanceof Error ? error.message : 'Could not save score')
      })
  }, [phase, signedIn, lastScore, myBestQuery.data?.score, submitMutation, queryClient, trpc])

  return (
    <LivePanelShell
      title="Relay Run"
      subtitle="Flap through the stack. Sign in to save high scores."
      scroll={false}
      meta={
        myBestQuery.data ? (
          <p className="font-mono text-[10px] text-zinc-500">PR {myBestQuery.data.score}</p>
        ) : null
      }
      footer={
        <div className="max-h-36 overflow-y-auto p-4">
          <p className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            Leaderboard
          </p>
          {leaderboardQuery.isPending ? (
            <p className="mt-2 font-mono text-xs text-zinc-600">Loading…</p>
          ) : (
            <ol className="mt-2 space-y-1 font-mono text-xs">
              {leaderboardQuery.data?.slice(0, 10).map((entry) => (
                <li key={entry.userId} className="flex justify-between text-zinc-400">
                  <span>
                    #{entry.rank} {entry.displayName}
                  </span>
                  <span className="text-amber-400">{entry.score}</span>
                </li>
              ))}
              {!leaderboardQuery.data?.length ? (
                <li className="text-zinc-600">No scores yet — be first.</li>
              ) : null}
            </ol>
          )}
          {phase === 'over' && !signedIn ? (
            <p className="mt-3 font-mono text-[10px] text-zinc-500">
              <button type="button" className="underline" onClick={onSignInClick}>
                Sign in
              </button>{' '}
              to save {lastScore} pts.
            </p>
          ) : null}
          {submitNote ? (
            <p className="mt-2 font-mono text-[10px] text-emerald-400">{submitNote}</p>
          ) : null}
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="max-h-full w-full max-w-full cursor-pointer border border-zinc-800 bg-black"
          style={{ aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}` }}
          onPointerDown={handleAction}
          aria-label="Relay Run mini-game"
        />
        {phase === 'idle' ? (
          <p className="mt-3 font-mono text-[10px] text-zinc-500">Tap or press Space to start</p>
        ) : null}
      </div>
    </LivePanelShell>
  )
}

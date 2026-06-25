'use client'

import { Button } from '@arche-template/ui/components/button'
import { Tabs, TabsList, TabsTrigger } from '@arche-template/ui/components/tabs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

import { LivePanelShell } from '@/components/live/live-panel-shell'
import { useLiveRoom } from '@/components/live/live-room-context'
import { RelayRunLeaderboardPanel } from '@/components/live/relay-run-leaderboard-panel'
import { RelayRunStatsPanel } from '@/components/live/relay-run-stats-panel'
import { ensureGuestSession } from '@/lib/ensure-guest-session'
import { createRelayRunAudio, readAudioMuted, type RelayRunAudio } from '@/lib/relay-run/audio'
import {
  createInitialState,
  flap,
  GAME_HEIGHT,
  getMedal,
  type GamePhase,
  type GameState,
  tick,
} from '@/lib/relay-run/engine'
import { matchGameShortcut } from '@/lib/relay-run/keyboard'
import { writeLocalBest } from '@/lib/relay-run/local-best'
import { clearPendingScore, readPendingScore, writePendingScore } from '@/lib/relay-run/offline'
import { drawFrame } from '@/lib/relay-run/renderer'
import { createThemedSprites } from '@/lib/relay-run/sprites'
import { useOnlineStatus } from '@/lib/use-online-status'
import { useTRPC } from '@/trpc/client'

const TARGET_FRAME_MS = 1000 / 60

function setupCanvasResolution(
  canvas: HTMLCanvasElement,
  playAreaSize: { width: number; height: number },
  gameWidth: number,
  isFullscreen: boolean,
): CanvasRenderingContext2D | null {
  const dprCap = isFullscreen ? 3 : 2
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
  const physicalWidth = Math.round(playAreaSize.width * dpr)
  const physicalHeight = Math.round(playAreaSize.height * dpr)

  canvas.width = physicalWidth
  canvas.height = physicalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const scaleX = physicalWidth / gameWidth
  const scaleY = physicalHeight / GAME_HEIGHT
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  ctx.imageSmoothingEnabled = false

  return ctx
}

function FullscreenIcon({ exit }: { exit?: boolean }) {
  if (exit) {
    return (
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
        <path
          fill="currentColor"
          d="M2 6V2h4V0H0v6h2zm12-4h-4v2h4v4h2V0h-2zM2 10H0v6h6v-2H2v-4zm14 4h-4v2h6v-6h-2v4z"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M0 2h6V0H0v6h2V2zm10 0h6v6h-2V2h-4V0h2zm-8 12H0v-6h2v4h4v2zm12-4v4h-4v2h6v-6h-2z"
      />
    </svg>
  )
}

function AudioIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
        <path
          fill="currentColor"
          d="M2 5.5h2.5L8 2.5v11L4.5 10.5H2V5.5zm7.2 1.4L11.8 7l1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4z"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M2 5.5h2.5L8 2.5v11L4.5 10.5H2V5.5zm4.2 2.8v0c1.6-1 3.5-1 5.1 0 .5.3.8.9.8 1.5v.2c0 .6-.3 1.2-.8 1.5-1.6 1-3.5 1-5.1 0-.5-.3-.8-.9-.8-1.5v-.2c0-.6.3-1.2.8-1.5zm6.3-.3c.8.5 1.3 1.3 1.3 2.3v.2c0 1-.5 1.8-1.3 2.3.3-.9.3-1.9 0-2.8z"
      />
    </svg>
  )
}

function GameCanvas({
  canvasRef,
  onPointerDown,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  onPointerDown: () => void
}) {
  return (
    <canvas
      ref={canvasRef}
      className="size-full touch-none cursor-pointer border border-zinc-800 bg-black"
      onPointerDown={onPointerDown}
      aria-label="Relay Run mini-game"
    />
  )
}

function playGameSounds(
  audio: RelayRunAudio | null,
  prevPhase: GamePhase,
  prevScore: number,
  next: GameState,
): void {
  if (!audio) return
  if (next.score > prevScore) audio.play('score')
  if (prevPhase === 'playing' && next.phase === 'dead') audio.play('hit')
}

function shouldRunAnimationLoop(
  phase: GamePhase,
  options: { activeTab: string; isFullscreen: boolean; documentHidden: boolean },
): boolean {
  if (options.documentHidden) return false
  const active = options.isFullscreen || options.activeTab === 'play'
  return active && (phase === 'playing' || phase === 'dead' || phase === 'idle')
}

export function RelayRunGame({
  signedIn,
  isRegistered = signedIn,
  userId,
  apiReachable = true,
  onSignInClick,
  onOpenChat,
}: {
  signedIn: boolean
  isRegistered?: boolean
  userId?: string
  apiReachable?: boolean
  onSignInClick?: () => void
  onOpenChat?: () => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { relayChatOpen, registerFullscreenHost } = useLiveRoom()
  const browserOnline = useOnlineStatus()
  const offline = !browserOnline || !apiReachable

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const playAreaRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<GameState>(createInitialState())
  const rafRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number | null>(null)
  const spritesRef = useRef<ReturnType<typeof createThemedSprites> | null>(null)
  const submittedDeathRef = useRef<number | null>(null)
  const pendingSyncRef = useRef<number | null>(null)
  const activeTabRef = useRef('play')
  const isFullscreenRef = useRef(false)
  const documentHiddenRef = useRef(false)
  const manualPausedRef = useRef(false)
  const relayChatOpenRef = useRef(false)
  const audioRef = useRef<RelayRunAudio | null>(null)
  const liveScoreRef = useRef(0)

  const [lastScore, setLastScore] = useState(0)
  const [deathId, setDeathId] = useState(0)
  const [submitNote, setSubmitNote] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('play')
  const [documentHidden, setDocumentHidden] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [liveScore, setLiveScore] = useState(0)
  const [audioMuted, setAudioMuted] = useState(false)
  const [fullscreenNote, setFullscreenNote] = useState<string | null>(null)
  const [runPaused, setRunPaused] = useState(false)
  const [manualPaused, setManualPaused] = useState(false)
  const [playAreaSize, setPlayAreaSize] = useState({ width: 320, height: 480 })
  const [gameWidth, setGameWidth] = useState(320)

  activeTabRef.current = activeTab
  isFullscreenRef.current = isFullscreen
  documentHiddenRef.current = documentHidden
  manualPausedRef.current = manualPaused
  relayChatOpenRef.current = relayChatOpen

  const myBestQuery = useQuery({
    ...trpc.game.myBest.queryOptions(),
    enabled: signedIn && !offline,
  })
  const submitMutation = useMutation(trpc.game.submitScore.mutationOptions())

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastFrameRef.current = null
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (!spritesRef.current) {
      spritesRef.current = createThemedSprites()
    }
    drawFrame(ctx, stateRef.current, spritesRef.current, { reducedMotion })
  }, [reducedMotion])

  const syncLiveScore = useCallback((score: number) => {
    if (score === liveScoreRef.current) return
    liveScoreRef.current = score
    setLiveScore(score)
  }, [])

  const loop = useCallback(
    (timestamp: number) => {
      const simulating = shouldRunAnimationLoop(stateRef.current.phase, {
        activeTab: activeTabRef.current,
        isFullscreen: isFullscreenRef.current,
        documentHidden: documentHiddenRef.current,
      })

      if (!simulating) {
        stopLoop()
        audioRef.current?.stopMusic()
        return
      }

      if (manualPausedRef.current || relayChatOpenRef.current) {
        stopLoop()
        audioRef.current?.stopMusic()
        return
      }

      const last = lastFrameRef.current ?? timestamp
      lastFrameRef.current = timestamp
      const dt = Math.min((timestamp - last) / TARGET_FRAME_MS, 2)

      const prevPhase = stateRef.current.phase
      const prevScore = stateRef.current.score

      const next = tick(stateRef.current, dt)
      stateRef.current = next

      playGameSounds(audioRef.current, prevPhase, prevScore, next)

      // Milestone trigger sound chime
      if (next.score > prevScore) {
        const isMilestone = next.score === 10 || next.score === 25 || next.score === 50
        const isMultipleOf10 = next.score > 0 && next.score % 10 === 0
        if (isMilestone || isMultipleOf10) {
          audioRef.current?.play('milestone')
        }
      }

      syncLiveScore(next.score)
      render()

      // Handle transition to dead
      if (prevPhase === 'playing' && next.phase === 'dead') {
        audioRef.current?.stopMusic()
        setRunPaused(false)
        setManualPaused(false)
        manualPausedRef.current = false
        setLastScore(next.score)
        setDeathId((id) => id + 1)
        writeLocalBest(next.score)
        if (offline) {
          writePendingScore(next.score)
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    },
    [render, offline, stopLoop, syncLiveScore],
  )

  const startLoop = useCallback(() => {
    if (manualPausedRef.current || relayChatOpenRef.current) return
    if (
      !shouldRunAnimationLoop(stateRef.current.phase, {
        activeTab: activeTabRef.current,
        isFullscreen: isFullscreenRef.current,
        documentHidden: documentHiddenRef.current,
      })
    ) {
      return
    }
    stopLoop()
    lastFrameRef.current = null
    rafRef.current = requestAnimationFrame(loop)
  }, [loop, stopLoop])

  const handleAction = useCallback(() => {
    audioRef.current?.prime()
    const prevPhase = stateRef.current.phase
    const next = flap(stateRef.current)
    stateRef.current = next

    if (prevPhase !== 'playing' && next.phase === 'playing') {
      audioRef.current?.play('start')
      audioRef.current?.startMusic()
    } else if (prevPhase === 'playing') {
      audioRef.current?.play('flap')
    }

    render()

    if (prevPhase !== 'playing' && next.phase === 'playing') {
      syncLiveScore(0)
      setSubmitNote(null)
      submittedDeathRef.current = null
      setRunPaused(false)
      setManualPaused(false)
      manualPausedRef.current = false
      startLoop()
    }
  }, [render, startLoop, syncLiveScore])

  const toggleAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = createRelayRunAudio()
    const muted = audioRef.current.toggleMuted()
    setAudioMuted(muted)
    if (!muted) {
      audioRef.current.prime()
      if (stateRef.current.phase === 'playing') {
        audioRef.current.startMusic()
      }
    } else {
      audioRef.current.stopMusic()
    }
  }, [])

  const togglePause = useCallback(() => {
    if (stateRef.current.phase !== 'playing') return

    const onPlaySurface = isFullscreenRef.current || activeTabRef.current === 'play'
    if (!onPlaySurface) return

    if (manualPausedRef.current) {
      manualPausedRef.current = false
      setManualPaused(false)
      setRunPaused(false)
      audioRef.current?.startMusic()
      startLoop()
      return
    }

    manualPausedRef.current = true
    setManualPaused(true)
    setRunPaused(true)
    stopLoop()
    audioRef.current?.stopMusic()
    render()
  }, [render, startLoop, stopLoop])

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      setFullscreenNote('Fullscreen is not available in this browser')
      window.setTimeout(() => setFullscreenNote(null), 4000)
    }
  }, [])

  // ResizeObserver: measures viewport bounds to adapt ratio dynamically
  useEffect(() => {
    const el = playAreaRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const parentW = entry.contentRect.width
      const parentH = entry.contentRect.height

      if (parentW === 0 || parentH === 0) return

      const rawRatio = parentW / parentH
      const minRatio = 0.52 // Narrow portrait (Instagram reels style layout)
      const maxRatio = 1.78 // Landscape layout (Laptop wide coverage)
      const ratio = Math.max(minRatio, Math.min(maxRatio, rawRatio))

      let width = parentW
      let height = parentH

      if (rawRatio > ratio) {
        // wider than max ratio -> constrain width
        width = parentH * ratio
        height = parentH
      } else if (rawRatio < ratio) {
        // narrower than min ratio -> constrain height
        width = parentW
        height = parentW / ratio
      }

      const computedGameWidth = Math.round(GAME_HEIGHT * ratio)
      setPlayAreaSize({ width, height })
      setGameWidth(computedGameWidth)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Canvas size synchronization with playAreaSize and gameWidth adjustments
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setupCanvasResolution(canvas, playAreaSize, gameWidth, isFullscreen)
    stateRef.current.gameWidth = gameWidth
    render()
  }, [playAreaSize, gameWidth, isFullscreen, render])

  useEffect(() => {
    audioRef.current = createRelayRunAudio()
    setAudioMuted(readAudioMuted())
    spritesRef.current = createThemedSprites()
    render()
  }, [render])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    registerFullscreenHost(containerRef.current)
    return () => registerFullscreenHost(null)
  }, [registerFullscreenHost])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (relayChatOpen) return
      const shortcut = matchGameShortcut(event)
      if (!shortcut) return

      if (shortcut === 'flap') {
        event.preventDefault()
        handleAction()
        return
      }

      event.preventDefault()

      if (shortcut === 'fullscreen') {
        void toggleFullscreen()
        return
      }
      if (shortcut === 'mute') {
        toggleAudio()
        return
      }
      if (shortcut === 'pause') {
        togglePause()
        return
      }
      if (shortcut === 'chat') {
        onOpenChat?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleAction, onOpenChat, relayChatOpen, toggleAudio, toggleFullscreen, togglePause])

  useEffect(() => {
    const onFullscreen = () => {
      const nextFullscreen = Boolean(document.fullscreenElement)
      setIsFullscreen(nextFullscreen)
      const canvas = canvasRef.current
      if (canvas) {
        setupCanvasResolution(canvas, playAreaSize, gameWidth, nextFullscreen)
        stateRef.current.gameWidth = gameWidth
      }
      requestAnimationFrame(() => render())
    }
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [gameWidth, playAreaSize, render])

  useEffect(() => {
    const onVisibility = () => {
      setDocumentHidden(document.hidden)
    }
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const simulating = shouldRunAnimationLoop(stateRef.current.phase, {
      activeTab,
      isFullscreen,
      documentHidden,
    })
    if (!simulating) {
      stopLoop()
      audioRef.current?.stopMusic()
      if (stateRef.current.phase === 'playing') {
        setRunPaused(true)
      }
      return
    }
    if (manualPaused || relayChatOpen) {
      stopLoop()
      audioRef.current?.stopMusic()
      setRunPaused(true)
      render()
      return
    }
    setRunPaused(false)
    if (stateRef.current.phase === 'playing') {
      audioRef.current?.startMusic()
    }
    if (rafRef.current === null) {
      startLoop()
    }
  }, [
    activeTab,
    documentHidden,
    isFullscreen,
    manualPaused,
    relayChatOpen,
    render,
    startLoop,
    stopLoop,
  ])

  useEffect(() => {
    return () => {
      stopLoop()
      audioRef.current?.stopMusic()
    }
  }, [stopLoop])

  useEffect(() => {
    if (lastScore < 1) return
    if (stateRef.current.phase !== 'dead') return
    if (submittedDeathRef.current === deathId) return
    if (submitMutation.isPending) return

    if (offline) {
      submittedDeathRef.current = deathId
      writePendingScore(lastScore)
      setSubmitNote('Saved locally — will sync when you are back online')
      return
    }

    let cancelled = false

    void (async () => {
      submittedDeathRef.current = deathId

      if (!signedIn) {
        try {
          await ensureGuestSession(queryClient, trpc.auth.getSession.queryKey(), () =>
            queryClient.fetchQuery(trpc.auth.getSession.queryOptions()),
          )
        } catch {
          if (cancelled) return
          writePendingScore(lastScore)
          setSubmitNote('Saved locally — could not start guest session')
          return
        }
      }

      if (cancelled) return

      let best: number | undefined
      try {
        const myBest = await queryClient.fetchQuery(trpc.game.myBest.queryOptions())
        best = myBest?.score
      } catch {
        best = undefined
      }

      if (best !== undefined && lastScore <= best) {
        setSubmitNote(`Best: ${best}`)
        return
      }

      try {
        const result = await submitMutation.mutateAsync({ score: lastScore })
        clearPendingScore()
        setSubmitNote(result.rank ? `Saved — rank #${result.rank}` : `Saved — ${result.score} pts`)
        void queryClient.invalidateQueries({ queryKey: trpc.game.leaderboard.queryKey() })
        void queryClient.invalidateQueries({ queryKey: trpc.game.myBest.queryKey() })
      } catch (error: unknown) {
        submittedDeathRef.current = null
        writePendingScore(lastScore)
        setSubmitNote(
          error instanceof Error
            ? `${error.message} — score queued locally`
            : 'Could not save score — queued locally',
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    deathId,
    lastScore,
    offline,
    queryClient,
    signedIn,
    submitMutation,
    trpc.auth.getSession,
    trpc.game.leaderboard,
    trpc.game.myBest,
  ])

  useEffect(() => {
    if (offline || submitMutation.isPending) return
    const pending = readPendingScore()
    if (pending === null || pending < 1) return
    if (pendingSyncRef.current === pending) return

    pendingSyncRef.current = pending
    let cancelled = false

    void (async () => {
      try {
        if (!signedIn) {
          try {
            await ensureGuestSession(queryClient, trpc.auth.getSession.queryKey(), () =>
              queryClient.fetchQuery(trpc.auth.getSession.queryOptions()),
            )
          } catch {
            return
          }
        }

        if (cancelled) return

        let best: number | undefined
        try {
          const myBest = await queryClient.fetchQuery(trpc.game.myBest.queryOptions())
          best = myBest?.score
        } catch {
          best = undefined
        }

        if (best !== undefined && pending <= best) {
          clearPendingScore()
          return
        }

        const result = await submitMutation.mutateAsync({ score: pending })
        clearPendingScore()
        setSubmitNote(
          result.rank ? `Synced — rank #${result.rank}` : `Synced — ${result.score} pts`,
        )
        void queryClient.invalidateQueries({ queryKey: trpc.game.leaderboard.queryKey() })
        void queryClient.invalidateQueries({ queryKey: trpc.game.myBest.queryKey() })
      } catch {
        // pending score stays in localStorage for a later retry
      } finally {
        if (pendingSyncRef.current === pending) {
          pendingSyncRef.current = null
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    apiReachable,
    browserOnline,
    offline,
    queryClient,
    signedIn,
    submitMutation,
    trpc.auth.getSession,
    trpc.game.leaderboard,
    trpc.game.myBest,
  ])

  const medal = getMedal(myBestQuery.data?.score ?? lastScore)

  return (
    <LivePanelShell
      title="Relay Run"
      compact
      subtitle={offline ? 'Offline — scores stay on this device until the API is back.' : undefined}
      scroll={false}
      meta={
        <div className="flex items-center gap-2">
          {offline ? (
            <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
              Offline
            </p>
          ) : null}
          {signedIn && myBestQuery.data ? (
            <p className="font-mono text-[10px] text-zinc-500">PR {myBestQuery.data.score}</p>
          ) : null}
          {fullscreenNote ? (
            <p className="font-mono text-[10px] text-amber-400">{fullscreenNote}</p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="border-zinc-700 font-mono text-[10px] tracking-widest uppercase active:scale-[0.96] transition-transform"
            onClick={toggleAudio}
            aria-label={audioMuted ? 'Unmute game audio' : 'Mute game audio'}
            aria-pressed={audioMuted}
          >
            <AudioIcon muted={audioMuted} />
            {audioMuted ? 'Unmute' : 'Mute'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="border-zinc-700 font-mono text-[10px] tracking-widest uppercase active:scale-[0.96] transition-transform"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <FullscreenIcon exit={isFullscreen} />
            {isFullscreen ? 'Exit' : 'Full'}
          </Button>
        </div>
      }
    >
      <div
        ref={containerRef}
        className={
          isFullscreen
            ? 'flex h-dvh w-screen flex-col bg-black'
            : 'flex h-full min-h-0 min-w-0 flex-col'
        }
      >
        {!isFullscreen ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
            <TabsList
              variant="line"
              className="w-full justify-start border-b border-zinc-800 bg-zinc-950/50 px-2"
            >
              <TabsTrigger
                value="play"
                className="font-mono text-[10px] tracking-widest uppercase data-active:text-amber-400 active:scale-[0.96] transition-transform"
              >
                Play
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="font-mono text-[10px] tracking-widest uppercase data-active:text-amber-400 active:scale-[0.96] transition-transform"
              >
                Leaderboard
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="font-mono text-[10px] tracking-widest uppercase data-active:text-amber-400 active:scale-[0.96] transition-transform"
              >
                Stats
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          {!isFullscreen && activeTab === 'leaderboard' ? (
            <div className="absolute inset-0 overflow-hidden p-4">
              <RelayRunLeaderboardPanel signedInUserId={userId} offline={offline} />
            </div>
          ) : null}

          {!isFullscreen && activeTab === 'stats' ? (
            <div className="absolute inset-0 overflow-hidden p-4">
              <RelayRunStatsPanel
                signedIn={signedIn}
                isRegistered={isRegistered}
                lastScore={lastScore}
                deathId={deathId}
                offline={offline}
                submitNote={submitNote}
                onSignInClick={onSignInClick}
              />
            </div>
          ) : null}

          <div
            className={`relative flex size-full min-h-0 min-w-0 flex-col overflow-hidden ${
              !isFullscreen && activeTab !== 'play' ? 'pointer-events-none invisible' : ''
            }`}
          >
            <div
              ref={playAreaRef}
              className="relative flex size-full min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden p-2"
            >
              <div
                style={{ width: playAreaSize.width, height: playAreaSize.height }}
                className="relative shrink-0 p-1.5 bg-zinc-950/40 border border-zinc-900/60 rounded-[24px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
              >
                <div className="size-full overflow-hidden rounded-[18px]">
                  <GameCanvas canvasRef={canvasRef} onPointerDown={handleAction} />
                </div>

                {isFullscreen ? (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="border-zinc-700 bg-black/50 font-mono text-[10px] uppercase active:scale-[0.96] transition-transform"
                      onClick={toggleAudio}
                      aria-label={audioMuted ? 'Unmute game audio' : 'Mute game audio'}
                      aria-pressed={audioMuted}
                    >
                      <AudioIcon muted={audioMuted} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="border-amber-700/60 bg-black/50 font-mono text-[10px] uppercase text-amber-300 active:scale-[0.96] transition-transform"
                      onClick={() => onOpenChat?.()}
                    >
                      Chat
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="border-zinc-700 bg-black/50 font-mono text-[10px] uppercase active:scale-[0.96] transition-transform"
                      onClick={() => void toggleFullscreen()}
                    >
                      Exit
                    </Button>
                  </div>
                ) : null}
              </div>

              {isFullscreen && relayChatOpen ? (
                <p className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center font-mono text-[10px] tracking-wide text-amber-400">
                  CHAT OPEN · ESC TO CLOSE · GAME PAUSED
                </p>
              ) : null}
              {!isFullscreen && activeTab === 'play' && !runPaused ? (
                <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[9px] text-zinc-600 tracking-wide">
                  TAP · SPACE · ENTER · F full · M mute · P pause · C chat
                </p>
              ) : null}
              {!isFullscreen && activeTab === 'play' && runPaused ? (
                <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[9px] text-amber-400 tracking-wide">
                  {relayChatOpen
                    ? 'CHAT OPEN — ESC TO CLOSE'
                    : manualPaused
                      ? 'PAUSED — P TO RESUME'
                      : 'PAUSED — RETURN TO CONTINUE'}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          Score {liveScore}
          {medal !== 'none' ? `, medal ${medal}` : ''}
        </p>
      </div>
    </LivePanelShell>
  )
}

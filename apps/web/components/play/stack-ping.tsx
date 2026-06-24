'use client'

import { cn } from '@arche-template/ui/lib/utils'
import { useCallback, useMemo, useState } from 'react'

import { API_HEALTH_TIMEOUT_MS, getApiHealthFetchUrl } from '@/lib/api-health'
import {
  appendPing,
  bestPingMs,
  hotStreak,
  pingTier,
  pingTierMeta,
  readPingHistory,
  writePingHistory,
  type PingResult,
  type PingTier,
} from '@/lib/stack-ping'

const MAX_BAR_MS = 400

function PingHistoryRow({ entry, isBest }: { entry: PingResult; isBest: boolean }) {
  const tier = pingTier(entry.ms)
  const meta = pingTierMeta(tier)
  const width = Math.min(100, Math.round((entry.ms / MAX_BAR_MS) * 100))

  return (
    <li className="flex items-center gap-3">
      <span
        className={cn('w-12 shrink-0 text-right font-mono text-sm tabular-nums', meta.textClass)}
      >
        {entry.ms}
        <span className="text-zinc-600">ms</span>
      </span>
      <div className="relative h-2 min-w-0 flex-1 bg-zinc-900">
        <div
          className={cn('absolute inset-y-0 left-0 transition-all', meta.barClass)}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="hidden w-14 shrink-0 font-mono text-[10px] text-zinc-600 sm:inline">
        {new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      {isBest ? (
        <span className="shrink-0 font-mono text-[9px] tracking-widest text-emerald-400 uppercase">
          PR
        </span>
      ) : (
        <span className="w-6 shrink-0" aria-hidden="true" />
      )}
    </li>
  )
}

export function StackPing() {
  const [history, setHistory] = useState<PingResult[]>(() => readPingHistory())
  const [running, setRunning] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ ms: number; tier: PingTier; isNewBest: boolean } | null>(
    null,
  )

  const best = bestPingMs(history)
  const streak = hotStreak(history)
  const latestTier = flash?.tier ?? (history[0] ? pingTier(history[0].ms) : null)
  const latestMeta = latestTier ? pingTierMeta(latestTier) : null

  const encouragement = useMemo(() => {
    if (flash?.isNewBest) return 'New personal best — keep the streak alive!'
    if (best !== null && history[0] && history[0].ms > best) {
      const delta = history[0].ms - best
      return `Beat your best (${best}ms) — you're ${delta}ms away.`
    }
    if (streak >= 3) return `${streak} hot pings in a row under 300ms.`
    if (!history.length) return 'Tap the target to measure round-trip latency to the API.'
    return latestMeta?.headline ?? ''
  }, [best, flash?.isNewBest, history, latestMeta?.headline, streak])

  const runPing = useCallback(async () => {
    setRunning(true)
    setLastError(null)
    setFlash(null)
    const started = performance.now()

    try {
      const response = await fetch(getApiHealthFetchUrl(), {
        signal: AbortSignal.timeout(API_HEALTH_TIMEOUT_MS),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const body = (await response.json()) as { database?: string; reachable?: boolean }
      if (body.reachable === false || (body.reachable !== true && body.database !== 'connected')) {
        throw new Error('database not connected')
      }

      const ms = Math.round(performance.now() - started)
      const tier = pingTier(ms)
      const next: PingResult = { ms, at: new Date().toISOString() }
      const previousBest = bestPingMs(history)
      const isNewBest = previousBest === null || ms < previousBest

      setHistory((prev) => {
        const updated = appendPing(prev, next)
        writePingHistory(updated)
        return updated
      })
      setFlash({ ms, tier, isNewBest })
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Ping failed')
    } finally {
      setRunning(false)
    }
  }, [history])

  return (
    <div className="flex h-[min(560px,72vh)] flex-col border border-zinc-800 bg-black">
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <p className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
          Stack ping
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Race the demo API — each tap measures health-check round-trip time.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <button
          type="button"
          onClick={() => void runPing()}
          disabled={running}
          aria-label={running ? 'Pinging API' : 'Ping API'}
          className={cn(
            'group relative flex size-36 items-center justify-center rounded-full border-2 transition-all duration-200 disabled:opacity-60',
            running
              ? 'border-zinc-600 bg-zinc-900'
              : flash
                ? cn('border-current bg-zinc-950', latestMeta?.ringClass, 'ring-4')
                : 'border-zinc-700 bg-zinc-950 hover:border-white hover:bg-zinc-900',
            latestMeta && flash ? latestMeta.textClass : 'text-white',
          )}
        >
          <span
            className={cn(
              'absolute inset-0 rounded-full border border-current opacity-0 transition-opacity',
              running && 'animate-ping opacity-30',
            )}
            aria-hidden="true"
          />
          <span className="relative text-center">
            {running ? (
              <span className="font-mono text-xs tracking-widest text-zinc-400 uppercase">…</span>
            ) : flash ? (
              <>
                <span className="block font-mono text-3xl font-bold tabular-nums">{flash.ms}</span>
                <span className="mt-1 block font-mono text-[10px] tracking-widest uppercase opacity-80">
                  {pingTierMeta(flash.tier).label}
                </span>
              </>
            ) : (
              <>
                <span className="block font-mono text-2xl font-bold">PING</span>
                <span className="mt-1 block font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  Tap
                </span>
              </>
            )}
          </span>
        </button>

        <p className="max-w-xs text-center text-sm text-zinc-400">{encouragement}</p>

        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[10px] tracking-widest uppercase">
          {best !== null ? (
            <span className="text-zinc-500">
              Best <span className="text-lg font-bold text-emerald-400 tabular-nums">{best}</span>
              <span className="text-zinc-600">ms</span>
            </span>
          ) : null}
          {streak >= 2 ? (
            <span className="border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-200">
              Streak ×{streak}
            </span>
          ) : null}
        </div>

        {lastError ? (
          <p className="text-center font-mono text-xs text-red-400">{lastError}</p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            Last {history.length || 0} pings
          </p>
          <div className="flex gap-2 font-mono text-[9px] text-zinc-600">
            <span className="text-emerald-500">&lt;100</span>
            <span className="text-lime-500">&lt;200</span>
            <span className="text-amber-500">&lt;300</span>
          </div>
        </div>

        {history.length ? (
          <ol className="space-y-2">
            {history.map((entry) => (
              <PingHistoryRow
                key={entry.at}
                entry={entry}
                isBest={best !== null && entry.ms === best}
              />
            ))}
          </ol>
        ) : (
          <p className="font-mono text-[10px] text-zinc-600">
            Your last five pings are saved locally in this browser.
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useCallback, useState } from 'react'

import config from '@/env'
import { API_HEALTH_TIMEOUT_MS } from '@/lib/api-health'
import {
  appendPing,
  bestPingMs,
  readPingHistory,
  writePingHistory,
  type PingResult,
} from '@/lib/stack-ping'

export function StackPing() {
  const [history, setHistory] = useState<PingResult[]>(() => readPingHistory())
  const [running, setRunning] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const best = bestPingMs(history)

  const runPing = useCallback(async () => {
    setRunning(true)
    setLastError(null)
    const started = performance.now()

    try {
      const response = await fetch(`${config.NEXT_PUBLIC_API_URL}/health`, {
        signal: AbortSignal.timeout(API_HEALTH_TIMEOUT_MS),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const body = (await response.json()) as { database?: string }
      if (body.database !== 'connected') {
        throw new Error('database not connected')
      }

      const ms = Math.round(performance.now() - started)
      const next: PingResult = { ms, at: new Date().toISOString() }
      setHistory((prev) => {
        const updated = appendPing(prev, next)
        writePingHistory(updated)
        return updated
      })
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Ping failed')
    } finally {
      setRunning(false)
    }
  }, [])

  return (
    <div className="border border-zinc-800 bg-black">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
          Stack ping
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Measure round-trip latency to the demo API health endpoint.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void runPing()}
            disabled={running}
            className="border border-white bg-white px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-black uppercase disabled:opacity-50"
          >
            {running ? 'Pinging…' : 'Ping API'}
          </button>
          {best !== null ? (
            <p className="font-mono text-xs text-zinc-400">
              Best: <span className="text-emerald-400">{best}ms</span>
            </p>
          ) : null}
        </div>

        {lastError ? <p className="font-mono text-xs text-red-400">{lastError}</p> : null}

        {history.length ? (
          <ol className="space-y-2 font-mono text-xs">
            {history.map((entry) => (
              <li
                key={entry.at}
                className="flex items-center justify-between border border-zinc-800 px-3 py-2"
              >
                <span className="text-zinc-200">{entry.ms}ms</span>
                <span className="text-zinc-600">{new Date(entry.at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="font-mono text-[10px] text-zinc-600">
            No pings yet — tap Ping API to start.
          </p>
        )}
      </div>
    </div>
  )
}

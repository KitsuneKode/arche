'use client'

import { useEffect, useState } from 'react'

type ApiState =
  | { status: 'checking'; message: string }
  | { status: 'online'; message: string }
  | { status: 'offline'; message: string }

export function ApiStatus() {
  const [apiState, setApiState] = useState<ApiState>({
    status: 'checking',
    message: 'Checking API health...',
  })

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    const controller = new AbortController()

    fetch(`${apiUrl.replace(/\/$/, '')}/health`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const payload = (await response.json().catch(() => null)) as { status?: string } | null
        setApiState({
          status: 'online',
          message: payload?.status ? `API says ${payload.status}` : 'API health route is online',
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setApiState({
          status: 'offline',
          message: error instanceof Error ? error.message : 'API is not reachable yet',
        })
      })

    return () => controller.abort()
  }, [])

  return (
    <section className="status" aria-label="Live API status">
      <div>
        <span className={apiState.status === 'online' ? 'dot online' : 'dot'} />
        <p className="eyebrow">Live API check</p>
        <h2>{apiState.message}</h2>
      </div>
      <code>NEXT_PUBLIC_API_URL=http://localhost:3001</code>
    </section>
  )
}

import { NextResponse } from 'next/server'

import config from '@/env'
import { API_HEALTH_SERVER_TIMEOUT_MS, type ApiHealthStatus } from '@/lib/api-health'

function isConnectedDatabase(database: string | undefined): boolean {
  return database === 'connected'
}

/** Same-origin health proxy — browser hits Vercel; Vercel probes the demo API. */
export async function GET(): Promise<NextResponse<ApiHealthStatus>> {
  const started = Date.now()

  try {
    const response = await fetch(`${config.NEXT_PUBLIC_API_URL}/health`, {
      signal: AbortSignal.timeout(API_HEALTH_SERVER_TIMEOUT_MS),
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
    const latencyMs = Date.now() - started

    if (!response.ok) {
      return NextResponse.json({ reachable: false, latencyMs })
    }

    const body = (await response.json()) as { database?: string; status?: string }
    return NextResponse.json({
      reachable: isConnectedDatabase(body.database),
      database: body.database,
      latencyMs,
    })
  } catch {
    return NextResponse.json({ reachable: false, latencyMs: Date.now() - started })
  }
}

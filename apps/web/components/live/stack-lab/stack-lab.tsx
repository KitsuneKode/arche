'use client'

import { useState, useTransition } from 'react'

import type { RouterOutputs } from '@arche-template/trpc'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { probeHealth, probeHello } from '@/app/(sandbox)/live/actions'
import { LiveResult } from '@/components/live/stack-lab/live-result'
import { StackLabProject } from '@/components/live/stack-lab/stack-lab-project'
import { useTRPC } from '@/trpc/client'

type StackSnapshot = RouterOutputs['demo']['stackSnapshot']

const WEB_CODE = `// apps/web/app/(sandbox)/live/page.tsx
const api = await trpcCaller()
await prefetch(trpc.chat.list.queryOptions())
const snapshot = await api.demo.stackSnapshot()`

const API_CODE = `// Server action — no browser fetch
const res = await fetch(apiPath('/health'), {
  cache: 'no-store',
})`

const TRPC_CODE = `// apps/web/app/(sandbox)/live/actions.ts
'use server'
const api = await trpcCaller()
return api.hello({ name })`

const PRISMA_CODE = `// apps/server/src/modules/post/post.repository.ts
prisma.post.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
})`

const AUTH_CODE = `// Protected procedure
auth.getSecretMessage // session required`

const REALTIME_CODE = `// GET /api/live/stream
// chat:message events append to React Query cache`

export function StackLab({
  initialSnapshot,
  onOpenRoom,
}: {
  initialSnapshot: StackSnapshot | null
  onOpenRoom: () => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [helloName, setHelloName] = useState('Arche')
  const [helloResult, setHelloResult] = useState<unknown>(null)
  const [helloError, setHelloError] = useState<string | null>(null)
  const [healthResult, setHealthResult] = useState<unknown>(initialSnapshot?.health ?? null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [pendingHello, startHello] = useTransition()
  const [pendingHealth, startHealth] = useTransition()
  const [secretResult, setSecretResult] = useState<string | null>(null)
  const [secretError, setSecretError] = useState<string | null>(null)
  const [pendingSecret, startSecret] = useTransition()

  const postsQuery = useQuery(trpc.post.list.queryOptions())
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const capabilitiesQuery = useQuery(trpc.demo.capabilities.queryOptions())

  const runHello = () => {
    setHelloError(null)
    startHello(async () => {
      try {
        const result = await probeHello(helloName)
        setHelloResult(result)
      } catch (error) {
        setHelloError(error instanceof Error ? error.message : 'Hello probe failed')
      }
    })
  }

  const runHealth = () => {
    setHealthError(null)
    startHealth(async () => {
      try {
        const result = await probeHealth()
        setHealthResult(result)
      } catch (error) {
        setHealthError(error instanceof Error ? error.message : 'Health probe failed')
      }
    })
  }

  const runSecret = () => {
    setSecretError(null)
    startSecret(async () => {
      try {
        const message = await queryClient.fetchQuery(trpc.auth.getSecretMessage.queryOptions())
        setSecretResult(message)
      } catch (error) {
        setSecretError(error instanceof Error ? error.message : 'Protected probe failed')
      }
    })
  }

  return (
    <div className="space-y-4">
      <StackLabProject
        layer="Web · RSC"
        title="How this page loaded"
        description="The server prefetches public demo queries and renders this snapshot before hydration. No HTTP loopback from the browser for the initial paint."
        code={WEB_CODE}
      >
        <LiveResult
          value={initialSnapshot}
          error={initialSnapshot ? null : 'Snapshot unavailable'}
        />
      </StackLabProject>

      <StackLabProject
        layer="API · Express"
        title="Health probe"
        description="REST health checks power the proof ladder and offline banners. This button runs the same path from a server action."
        code={API_CODE}
        actions={
          <button
            type="button"
            onClick={runHealth}
            disabled={pendingHealth}
            className="border border-zinc-700 px-3 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-500"
          >
            {pendingHealth ? 'Probing…' : 'Try it'}
          </button>
        }
      >
        <LiveResult value={healthResult} pending={pendingHealth} error={healthError} />
      </StackLabProject>

      <StackLabProject
        layer="tRPC · Contract"
        title="Hello procedure"
        description="Typed input/output shared across server actions, RSC callers, and client hooks via AppRouter."
        code={TRPC_CODE}
        actions={
          <>
            <input
              value={helloName}
              onChange={(event) => setHelloName(event.target.value)}
              className="min-w-[8rem] border border-zinc-800 bg-black px-2 py-1.5 font-mono text-xs text-white"
              aria-label="Name for hello probe"
            />
            <button
              type="button"
              onClick={runHello}
              disabled={pendingHello}
              className="border border-zinc-700 px-3 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-500"
            >
              {pendingHello ? 'Running…' : 'Try it'}
            </button>
          </>
        }
      >
        <LiveResult value={helloResult} pending={pendingHello} error={helloError} />
      </StackLabProject>

      <StackLabProject
        layer="Prisma · Datastore"
        title="Published posts"
        description="Hydrated from SSR prefetch — expand the list client-side without a loading flash when the API is up."
        code={PRISMA_CODE}
        actions={
          <button
            type="button"
            onClick={() => void postsQuery.refetch()}
            className="border border-zinc-700 px-3 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-500"
          >
            Refresh
          </button>
        }
      >
        <LiveResult
          value={
            postsQuery.isPending
              ? undefined
              : {
                  count: postsQuery.data?.length ?? 0,
                  titles: postsQuery.data?.slice(0, 5).map((post) => post.title) ?? [],
                }
          }
          pending={postsQuery.isPending}
          error={postsQuery.isError ? 'post.list failed' : null}
        />
      </StackLabProject>

      <StackLabProject
        layer="Auth · Better Auth"
        title="Session gate"
        description="Public session probe plus a protected procedure. Email stays server-side; only display name is shown."
        code={AUTH_CODE}
        actions={
          <button
            type="button"
            onClick={runSecret}
            disabled={!sessionQuery.data?.user || pendingSecret}
            className="border border-zinc-700 px-3 py-1.5 font-mono text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-500 disabled:opacity-40"
          >
            {pendingSecret ? 'Fetching…' : 'getSecretMessage'}
          </button>
        }
      >
        <LiveResult
          value={{
            signedIn: Boolean(sessionQuery.data?.user),
            displayName: sessionQuery.data?.user?.name ?? null,
            isAnonymous: sessionQuery.data?.user?.isAnonymous ?? null,
            secret: secretResult,
          }}
          pending={sessionQuery.isPending || pendingSecret}
          error={secretError}
        />
      </StackLabProject>

      <StackLabProject
        layer="Realtime · SSE"
        title="Live room bus"
        description="One shared EventSource pushes chat messages and leaderboard ticks. Polling is the fallback when SSE is unavailable."
        code={REALTIME_CODE}
        actions={
          <>
            <button
              type="button"
              onClick={onOpenRoom}
              className="border border-amber-900/50 bg-amber-950/30 px-3 py-1.5 font-mono text-[10px] tracking-widest text-amber-300 uppercase hover:border-amber-700"
            >
              Open Room
            </button>
            <span className="self-center font-mono text-[10px] text-zinc-600">
              mode: {capabilitiesQuery.data?.liveSync ?? '…'}
            </span>
          </>
        }
      >
        <LiveResult
          value={{
            stream: '/api/live/stream',
            sync: capabilitiesQuery.data?.liveSync,
            autoSignIn: capabilitiesQuery.data?.autoSignIn,
          }}
          pending={capabilitiesQuery.isPending}
        />
      </StackLabProject>
    </div>
  )
}

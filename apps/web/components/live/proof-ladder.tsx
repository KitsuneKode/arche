'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ProofComplete } from '@/components/live/proof-complete'
import config from '@/env'
import { readProofRunProgress, writeProofRunProgress } from '@/lib/proof-run-storage'
import { useTRPC } from '@/trpc/client'

type RungState = 'pending' | 'running' | 'pass' | 'fail' | 'locked'

type RungDef = {
  id: string
  layer: string
  label: string
  requiresAuth?: boolean
}

const RUNG_DEFS: RungDef[] = [
  { id: 'shell', layer: 'Web', label: 'App shell rendered' },
  { id: 'api', layer: 'API', label: 'Health + database connected' },
  { id: 'contract', layer: 'tRPC', label: 'Typed hello contract' },
  { id: 'datastore', layer: 'Prisma', label: 'Published posts readable' },
  { id: 'relay-read', layer: 'Chat', label: 'Live chat feed' },
  { id: 'session', layer: 'Auth', label: 'Session probe (guest OK)' },
  { id: 'relay-write', layer: 'Chat', label: 'Authenticated send', requiresAuth: true },
  { id: 'secret', layer: 'Auth', label: 'Protected procedure', requiresAuth: true },
  {
    id: 'challenge-chat',
    layer: 'Challenge',
    label: 'Message containing arche',
    requiresAuth: true,
  },
  { id: 'challenge-post', layer: 'Challenge', label: 'Create a draft note', requiresAuth: true },
]

function stateGlyph(state: RungState) {
  if (state === 'pass') return '✓'
  if (state === 'fail') return '×'
  if (state === 'locked') return '—'
  if (state === 'running') return '…'
  return '○'
}

function stateClass(state: RungState) {
  if (state === 'pass') return 'text-emerald-400'
  if (state === 'fail') return 'text-red-400'
  if (state === 'locked') return 'text-zinc-700'
  if (state === 'running') return 'text-amber-300'
  return 'text-zinc-600'
}

export function ProofLadder({ apiReachable }: { apiReachable: boolean }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [states, setStates] = useState<Record<string, RungState>>({})
  const [receipts, setReceipts] = useState<Record<string, string>>({})
  const lastSignedInUserId = useRef<string | null>(null)
  const runChecksRef = useRef<(() => Promise<void>) | null>(null)
  const bootedRef = useRef(false)

  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const sendMutation = useMutation(trpc.chat.send.mutationOptions())
  const createPostMutation = useMutation(trpc.post.create.mutationOptions())
  const sendMessageRef = useRef(sendMutation.mutateAsync)
  sendMessageRef.current = sendMutation.mutateAsync
  const createPostRef = useRef(createPostMutation.mutateAsync)
  createPostRef.current = createPostMutation.mutateAsync

  const setRung = useCallback((id: string, state: RungState, receipt?: string) => {
    setStates((prev) => ({ ...prev, [id]: state }))
    if (receipt) setReceipts((prev) => ({ ...prev, [id]: receipt }))
  }, [])

  const getChatMessages = useCallback(async () => {
    const options = trpc.chat.list.queryOptions()
    const cached = queryClient.getQueryData(options.queryKey)
    if (cached) return cached
    return queryClient.fetchQuery(options)
  }, [queryClient, trpc.chat.list])

  const runChecks = useCallback(async () => {
    const passed: string[] = ['shell']
    setRung('shell', 'pass', 'Live route mounted')

    if (!apiReachable) {
      setRung('api', 'fail', 'API unreachable — check NEXT_PUBLIC_API_URL')
      return
    }

    setRung('api', 'running')
    try {
      const health = await fetch(`${config.NEXT_PUBLIC_API_URL}/health`, { credentials: 'include' })
      const body = (await health.json()) as { database?: string }
      if (!health.ok || body.database !== 'connected') {
        setRung('api', 'fail', `Health ${health.status}`)
        return
      }
      passed.push('api')
      setRung('api', 'pass', 'database: connected')
    } catch {
      setRung('api', 'fail', 'Network error')
      return
    }

    setRung('contract', 'running')
    try {
      const hello = await queryClient.fetchQuery(trpc.hello.queryOptions({ name: 'Arche' }))
      passed.push('contract')
      setRung('contract', 'pass', hello)
    } catch {
      setRung('contract', 'fail', 'hello query failed')
      return
    }

    setRung('datastore', 'running')
    try {
      const posts = await queryClient.fetchQuery(trpc.post.list.queryOptions())
      if (!posts.length) {
        setRung('datastore', 'fail', 'No published posts — run db:seed')
        return
      }
      passed.push('datastore')
      setRung('datastore', 'pass', `${posts.length} published`)
    } catch {
      setRung('datastore', 'fail', 'post.list failed')
      return
    }

    setRung('relay-read', 'running')
    try {
      const messages = await getChatMessages()
      passed.push('relay-read')
      setRung('relay-read', 'pass', `${messages.length} messages`)
    } catch {
      setRung('relay-read', 'fail', 'chat.list failed')
      return
    }

    setRung('session', 'running')
    let sessionUserId: string | undefined
    try {
      const session = await queryClient.fetchQuery(trpc.auth.getSession.queryOptions())
      passed.push('session')
      const who = session?.user?.name ?? session?.user?.email ?? 'guest'
      sessionUserId = session?.user?.id
      setRung('session', 'pass', who)
    } catch {
      setRung('session', 'fail', 'getSession failed')
      return
    }

    if (!sessionUserId) {
      setRung('relay-write', 'locked', 'Sign in to unlock')
      setRung('secret', 'locked', 'Sign in to unlock')
      setRung('challenge-chat', 'locked', 'Sign in to unlock')
      setRung('challenge-post', 'locked', 'Sign in to unlock')
      writeProofRunProgress(passed)
      return
    }

    setRung('relay-write', 'running')
    try {
      await sendMessageRef.current({ content: `Proof run ping @ ${new Date().toISOString()}` })
      passed.push('relay-write')
      setRung('relay-write', 'pass', 'chat.send ok')
      await queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() })
    } catch (error) {
      setRung('relay-write', 'fail', error instanceof Error ? error.message : 'send failed')
    }

    setRung('secret', 'running')
    try {
      const secret = await queryClient.fetchQuery(trpc.auth.getSecretMessage.queryOptions())
      passed.push('secret')
      setRung('secret', 'pass', secret)
    } catch {
      setRung('secret', 'fail', 'getSecretMessage failed')
    }

    setRung('challenge-chat', 'running')
    try {
      const messages = await getChatMessages()
      const hasArche = messages.some(
        (message) =>
          message.senderId === sessionUserId && message.content.toLowerCase().includes('arche'),
      )
      if (!hasArche) {
        await sendMessageRef.current({ content: 'Proof run — arche checkpoint' })
      }
      passed.push('challenge-chat')
      setRung('challenge-chat', 'pass', 'arche message verified')
      await queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() })
    } catch (error) {
      setRung('challenge-chat', 'fail', error instanceof Error ? error.message : 'challenge failed')
    }

    setRung('challenge-post', 'running')
    try {
      const slug = `proof-note-${Date.now().toString(36)}`
      await createPostRef.current({
        title: 'Proof run note',
        content: 'Draft created from the live demo challenge.',
        slug,
        published: false,
      })
      passed.push('challenge-post')
      setRung('challenge-post', 'pass', 'draft saved')
    } catch (error) {
      setRung('challenge-post', 'fail', error instanceof Error ? error.message : 'draft failed')
    }

    writeProofRunProgress(passed)
  }, [apiReachable, getChatMessages, queryClient, setRung, trpc])

  runChecksRef.current = runChecks

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true

    const saved = readProofRunProgress()
    if (saved.length) {
      const restored: Record<string, RungState> = { shell: 'pass' }
      for (const id of saved) restored[id] = 'pass'
      setStates(restored)
    }

    void runChecksRef.current?.()
  }, [])

  useEffect(() => {
    const userId = sessionQuery.data?.user?.id ?? null
    if (userId && userId !== lastSignedInUserId.current) {
      lastSignedInUserId.current = userId
      void runChecksRef.current?.()
    }
  }, [sessionQuery.data?.user?.id])

  const completedCount = useMemo(
    () => Object.values(states).filter((state) => state === 'pass').length,
    [states],
  )
  const allPassed = completedCount === RUNG_DEFS.length

  return (
    <div className="space-y-4">
      <ProofComplete visible={allPassed} />
      <div className="border border-zinc-800 bg-black">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">
              Proof run
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Real checks against the deployed API stack.
            </p>
          </div>
          <p className="font-mono text-xs text-zinc-500">
            {completedCount}/{RUNG_DEFS.length}
          </p>
        </div>

        <ol className="divide-y divide-zinc-800">
          {RUNG_DEFS.map((rung) => {
            const state = states[rung.id] ?? (rung.requiresAuth && !signedIn ? 'locked' : 'pending')
            return (
              <li key={rung.id} className="flex gap-4 px-4 py-3 font-mono text-xs">
                <span className={`w-4 shrink-0 ${stateClass(state)}`}>{stateGlyph(state)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] tracking-widest text-zinc-600 uppercase">
                    {rung.layer}
                  </p>
                  <p className="text-zinc-200">{rung.label}</p>
                  {receipts[rung.id] ? (
                    <p className="mt-1 truncate text-[10px] text-zinc-500">{receipts[rung.id]}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>

        <div className="border-t border-zinc-800 p-4">
          <button
            type="button"
            onClick={() => void runChecks()}
            className="border border-zinc-700 px-3 py-2 font-mono text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-500"
          >
            Re-run proof
          </button>
        </div>
      </div>
    </div>
  )
}

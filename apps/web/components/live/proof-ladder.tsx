'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

import { ProofComplete } from '@/components/live/proof-complete'
import config from '@/env'
import {
  passedRungIds,
  PROOF_RUNGS,
  runProofRungs,
  type ProofRungResult,
  type ProofRungState,
} from '@/lib/proof-run'
import { readProofRunProgress, writeProofRunProgress } from '@/lib/proof-run-storage'
import { useTRPC } from '@/trpc/client'

type UiRungState = ProofRungState | 'pending' | 'running'

function stateGlyph(state: UiRungState) {
  if (state === 'pass') return '✓'
  if (state === 'fail') return '×'
  if (state === 'locked') return '—'
  if (state === 'running') return '…'
  return '○'
}

function stateClass(state: UiRungState) {
  if (state === 'pass') return 'text-emerald-400'
  if (state === 'fail') return 'text-red-400'
  if (state === 'locked') return 'text-zinc-700'
  if (state === 'running') return 'text-amber-300'
  return 'text-zinc-600'
}

function applyResults(
  results: ProofRungResult[],
  setStates: Dispatch<SetStateAction<Record<string, UiRungState>>>,
  setReceipts: Dispatch<SetStateAction<Record<string, string>>>,
) {
  const nextStates: Record<string, UiRungState> = {}
  const nextReceipts: Record<string, string> = {}
  for (const result of results) {
    nextStates[result.id] = result.state
    if (result.receipt) nextReceipts[result.id] = result.receipt
  }
  setStates((prev) => ({ ...prev, ...nextStates }))
  setReceipts((prev) => ({ ...prev, ...nextReceipts }))
  writeProofRunProgress(passedRungIds(results))
}

export function ProofLadder({
  apiReachable,
  signedIn: signedInProp,
  userId: userIdProp,
}: {
  apiReachable: boolean
  signedIn?: boolean
  userId?: string
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [states, setStates] = useState<Record<string, UiRungState>>({})
  const [receipts, setReceipts] = useState<Record<string, string>>({})
  const lastSignedInUserId = useRef<string | null>(null)
  const runChecksRef = useRef<(() => Promise<void>) | null>(null)
  const bootedRef = useRef(false)

  const sessionQuery = useQuery({
    ...trpc.auth.getSession.queryOptions(),
    enabled: signedInProp === undefined,
  })
  const signedIn = signedInProp ?? Boolean(sessionQuery.data?.user)
  const userId = userIdProp ?? sessionQuery.data?.user?.id
  const sendMutation = useMutation(trpc.chat.send.mutationOptions())
  const createPostMutation = useMutation(trpc.post.create.mutationOptions())
  const sendMessageRef = useRef(sendMutation.mutateAsync)
  sendMessageRef.current = sendMutation.mutateAsync
  const createPostRef = useRef(createPostMutation.mutateAsync)
  createPostRef.current = createPostMutation.mutateAsync

  const runChecks = useCallback(async () => {
    const results = await runProofRungs({
      apiReachable,
      fetchHealth: async () => {
        const response = await fetch(`${config.NEXT_PUBLIC_API_URL}/health`, {
          credentials: 'include',
        })
        const body = (await response.json()) as { database?: string }
        return { ok: response.ok, status: response.status, database: body.database }
      },
      fetchHello: () => queryClient.fetchQuery(trpc.hello.queryOptions({ name: 'Arche' })),
      fetchPosts: () => queryClient.fetchQuery(trpc.post.list.queryOptions()),
      fetchChatMessages: async () => {
        const options = trpc.chat.list.queryOptions()
        const cached = queryClient.getQueryData(options.queryKey)
        if (cached) return cached
        return queryClient.fetchQuery(options)
      },
      fetchSession: () => queryClient.fetchQuery(trpc.auth.getSession.queryOptions()),
      sendChatMessage: async (content) => {
        await sendMessageRef.current({ content })
      },
      fetchSecretMessage: () => queryClient.fetchQuery(trpc.auth.getSecretMessage.queryOptions()),
      createDraftPost: async (input) => {
        await createPostRef.current({
          ...input,
          published: false,
        })
      },
    })

    applyResults(results, setStates, setReceipts)
    await queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() })
  }, [apiReachable, queryClient, trpc])

  runChecksRef.current = runChecks

  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true

    const saved = readProofRunProgress()
    if (saved.length) {
      const restored: Record<string, UiRungState> = { shell: 'pass' }
      for (const id of saved) restored[id] = 'pass'
      setStates(restored)
    }

    void runChecksRef.current?.()
  }, [])

  useEffect(() => {
    const nextUserId = userId ?? null
    if (nextUserId && nextUserId !== lastSignedInUserId.current) {
      lastSignedInUserId.current = nextUserId
      void runChecksRef.current?.()
    }
  }, [userId])

  const completedCount = useMemo(
    () => Object.values(states).filter((state) => state === 'pass').length,
    [states],
  )
  const allPassed = completedCount === PROOF_RUNGS.length

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
            {completedCount}/{PROOF_RUNGS.length}
          </p>
        </div>

        <ol className="divide-y divide-zinc-800">
          {PROOF_RUNGS.map((rung) => {
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

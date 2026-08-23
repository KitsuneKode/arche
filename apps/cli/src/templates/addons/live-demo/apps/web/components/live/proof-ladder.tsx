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

import { LivePanelShell } from '@/components/live/live-panel-shell'
import { ProofComplete } from '@/components/live/proof-complete'
import { getApiHealthFetchUrl } from '@/lib/api-health'
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
  const verifySendMutation = useMutation(trpc.chat.verifySend.mutationOptions())
  const verifyScoreMutation = useMutation(trpc.game.verifyScore.mutationOptions())
  const createPostMutation = useMutation(trpc.post.create.mutationOptions())
  const verifySendRef = useRef(verifySendMutation.mutateAsync)
  verifySendRef.current = verifySendMutation.mutateAsync
  const verifyScoreRef = useRef(verifyScoreMutation.mutateAsync)
  verifyScoreRef.current = verifyScoreMutation.mutateAsync
  const createPostRef = useRef(createPostMutation.mutateAsync)
  createPostRef.current = createPostMutation.mutateAsync

  const runChecks = useCallback(async () => {
    const results = await runProofRungs({
      apiReachable,
      fetchHealth: async () => {
        const response = await fetch(getApiHealthFetchUrl(), {
          credentials: 'include',
        })
        const body = (await response.json()) as { database?: string; schema?: string }
        return {
          ok: response.ok,
          status: response.status,
          database: body.database,
          schema: body.schema,
        }
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
      fetchLeaderboard: () => queryClient.fetchQuery(trpc.game.leaderboard.queryOptions()),
      fetchMyBest: async () => {
        try {
          return await queryClient.fetchQuery(trpc.game.myBest.queryOptions())
        } catch {
          return null
        }
      },
      verifyChatSend: async (content) => {
        await verifySendRef.current({ content })
      },
      verifyGameScore: async (score) => {
        await verifyScoreRef.current({ score })
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
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <ProofComplete visible={allPassed} />
      <LivePanelShell
        compact
        title="Proof run"
        scroll={expanded}
        meta={
          <div className="flex shrink-0 items-center gap-2">
            <p className="font-mono text-[10px] text-zinc-500">
              {completedCount}/{PROOF_RUNGS.length}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="border border-zinc-700 px-2 py-0.5 font-mono text-[10px] tracking-widest text-zinc-400 uppercase hover:border-zinc-500 hover:text-zinc-200"
              aria-expanded={expanded}
            >
              {expanded ? 'Hide' : 'Show'}
            </button>
            {expanded ? (
              <button
                type="button"
                onClick={() => void runChecks()}
                className="border border-zinc-700 px-2 py-0.5 font-mono text-[10px] tracking-widest text-zinc-400 uppercase hover:border-zinc-500 hover:text-zinc-200"
              >
                Re-run
              </button>
            ) : null}
          </div>
        }
      >
        {expanded ? (
          <ol className="divide-y divide-zinc-800">
            {PROOF_RUNGS.map((rung) => {
              const state =
                states[rung.id] ?? (rung.requiresAuth && !signedIn ? 'locked' : 'pending')
              return (
                <li key={rung.id} className="flex gap-3 px-3 py-2 font-mono text-xs">
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
        ) : (
          <p className="px-3 py-2 font-mono text-[10px] text-zinc-500">
            Live API stack checks — expand when you want the full ladder.
          </p>
        )}
      </LivePanelShell>
    </div>
  )
}

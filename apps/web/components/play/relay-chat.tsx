'use client'

import { authClient } from '@arche-template/auth/client'
import { cn } from '@arche-template/ui/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { StatusPill } from '@/components/arche/site-primitives'
import { useLiveChat } from '@/components/live/use-live-chat'
import { formatUtcClockTime } from '@/lib/client-mounted'
import { useTRPC } from '@/trpc/client'

function initials(name: string | null | undefined) {
  const value = (name ?? '?').trim()
  const parts = value.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  return value.slice(0, 2).toUpperCase()
}

function RelayAuthComposer({ onSignedIn }: { onSignedIn?: () => void }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const authMutation = useMutation({
    mutationFn: async () => {
      setError(null)
      const result = await authClient.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message ?? 'Sign in failed')
      return result
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.auth.getSession.queryKey() })
      onSignedIn?.()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-sm">
      <p className="mb-3 text-sm text-zinc-300">Sign in to join the conversation</p>
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          authMutation.mutate()
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            aria-label="Email"
            className="w-full border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
          />
        </label>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            minLength={8}
            aria-label="Password"
            className="w-full border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
          />
        </label>
        <button
          type="submit"
          disabled={authMutation.isPending}
          className="shrink-0 border border-white bg-white px-5 py-2.5 font-mono text-[10px] font-bold tracking-widest text-black uppercase disabled:opacity-50"
        >
          {authMutation.isPending ? '…' : 'Sign in'}
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <p className="mt-2 text-[10px] text-zinc-600">
        No account? Use the full demo on{' '}
        <a href="/live" className="text-zinc-400 underline underline-offset-2">
          /live
        </a>{' '}
        to sign up.
      </p>
    </div>
  )
}

export function RelayChat() {
  const trpc = useTRPC()
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions())
  const signedIn = Boolean(sessionQuery.data?.user)
  const user = sessionQuery.data?.user
  const userId = user?.id

  const { draft, setDraft, messagesQuery, sendMutation, sendMessage, pollingFallback } =
    useLiveChat({ signedIn, userId })

  const scrollRef = useRef<HTMLDivElement>(null)
  const messageCount = messagesQuery.data?.length ?? 0

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messageCount, sendMutation.isPending])

  return (
    <div className="flex h-[min(560px,72vh)] flex-col border border-zinc-800 bg-black">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-xs font-bold tracking-widest text-white uppercase">
              #relay
            </h2>
            <StatusPill tone={pollingFallback ? 'watch' : 'ready'} pulse={!pollingFallback}>
              {pollingFallback ? 'Polling' : 'Live'}
            </StatusPill>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500">Public demo channel · tRPC + SSE</p>
        </div>
        {signedIn && user ? (
          <div className="flex shrink-0 items-center gap-2 border border-zinc-800 bg-zinc-950 px-2 py-1">
            <span
              className="flex size-7 items-center justify-center bg-amber-500/20 font-mono text-[10px] font-bold text-amber-200"
              aria-hidden="true"
            >
              {initials(user.name)}
            </span>
            <span className="max-w-[8rem] truncate font-mono text-[10px] text-zinc-300">
              {user.name ?? user.email}
            </span>
          </div>
        ) : (
          <span className="shrink-0 font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
            Read-only
          </span>
        )}
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(to_bottom,#09090b_0%,#000_100%)] p-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messagesQuery.isPending ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-xs text-zinc-600">Loading messages…</p>
          </div>
        ) : messagesQuery.isError ? (
          <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Chat unavailable — the demo API may be offline.
          </div>
        ) : messagesQuery.data?.length ? (
          messagesQuery.data.map((message) => {
            const isOwn = userId && message.senderId === userId
            const senderName = isOwn ? 'You' : (message.sender?.name ?? 'Guest')
            return (
              <div
                key={message.id}
                className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
              >
                {!isOwn ? (
                  <span
                    className="mt-1 flex size-8 shrink-0 items-center justify-center border border-zinc-800 bg-zinc-900 font-mono text-[10px] text-zinc-400"
                    aria-hidden="true"
                  >
                    {initials(message.sender?.name)}
                  </span>
                ) : null}
                <div
                  className={cn(
                    'max-w-[min(85%,20rem)] rounded-sm px-3 py-2',
                    isOwn
                      ? 'border border-amber-500/30 bg-amber-500/15 text-amber-50'
                      : 'border border-zinc-800 bg-zinc-900/80 text-zinc-100',
                  )}
                >
                  <p
                    className={cn(
                      'mb-1 font-mono text-[10px] tracking-wide uppercase',
                      isOwn ? 'text-amber-200/70' : 'text-zinc-500',
                    )}
                  >
                    {senderName}
                    <span className="ml-2 tracking-normal text-zinc-600 normal-case">
                      {formatUtcClockTime(message.createdAt)}
                    </span>
                  </p>
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
              Channel empty
            </p>
            <p className="max-w-xs text-sm text-zinc-600">
              Be the first to say hello — messages sync in real time when the API is up.
            </p>
          </div>
        )}
      </div>

      {signedIn ? (
        <form
          className="flex shrink-0 gap-2 border-t border-zinc-800 bg-zinc-950 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            sendMessage()
          }}
        >
          <input
            type="text"
            maxLength={280}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message #relay…"
            className="min-w-0 flex-1 rounded-sm border border-zinc-800 bg-black px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            aria-label="Chat message"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !draft.trim()}
            className="shrink-0 border border-white bg-white px-5 py-3 font-mono text-[10px] font-bold tracking-widest text-black uppercase transition-opacity disabled:opacity-40"
          >
            {sendMutation.isPending ? '…' : 'Send'}
          </button>
        </form>
      ) : (
        <RelayAuthComposer />
      )}

      {sendMutation.isError ? (
        <p className="shrink-0 px-4 pb-3 text-xs text-red-400">{sendMutation.error.message}</p>
      ) : null}
    </div>
  )
}

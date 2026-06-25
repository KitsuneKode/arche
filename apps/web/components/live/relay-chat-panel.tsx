'use client'

import { useEffect, useRef } from 'react'

import { useLiveRoom } from '@/components/live/live-room-context'
import { useLiveChat } from '@/components/live/use-live-chat'
import { formatRelativeTime, formatUtcClockTime, useClientMounted } from '@/lib/client-mounted'

export function RelayChatPanel({
  signedIn,
  guestPostEnabled = false,
  userId,
  onSignInClick,
  showHeader = true,
}: {
  signedIn: boolean
  guestPostEnabled?: boolean
  userId?: string
  onSignInClick?: () => void
  showHeader?: boolean
}) {
  const mounted = useClientMounted()
  const canPost = signedIn || guestPostEnabled
  const { pollingFallback } = useLiveRoom()
  const { draft, setDraft, messagesQuery, sendMutation, sendMessage, guestSessionError, stats } =
    useLiveChat({
      signedIn,
      guestPostEnabled,
      userId,
      useSharedRoom: true,
    })

  const scrollRef = useRef<HTMLDivElement>(null)
  const messageCount = messagesQuery.data?.length ?? 0
  const latestId = messagesQuery.data?.at(-1)?.id

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messageCount, sendMutation.isPending])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader ? (
        <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">#relay</p>
          <p className="mt-1 text-sm text-zinc-400">Room chat — live with the demo.</p>
          {stats ? (
            <p className="mt-2 font-mono text-[10px] text-zinc-600" suppressHydrationWarning>
              {stats.total} messages
              {mounted
                ? ` · ${formatRelativeTime(stats.latestAt)}`
                : stats.latestAt
                  ? ` · ${formatUtcClockTime(stats.latestAt)}`
                  : ''}
              {mounted ? (pollingFallback ? ' · polling' : ' · live') : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 font-mono text-xs"
        role="log"
        aria-live="polite"
        data-latest-message={latestId}
      >
        {messagesQuery.isPending ? (
          <p className="text-zinc-600">Loading feed…</p>
        ) : messagesQuery.isError ? (
          <p className="text-red-400">Feed unavailable.</p>
        ) : messagesQuery.data?.length ? (
          messagesQuery.data.map((message) => {
            const isSystem = message.kind === 'system'
            const isOwn = userId && message.senderId === userId
            if (isSystem) {
              return (
                <p
                  key={message.id}
                  className="border-l-2 border-amber-500/40 bg-amber-500/5 px-3 py-2 text-amber-200/90"
                >
                  {message.content}
                </p>
              )
            }
            return (
              <div
                key={message.id}
                className={`border-l-2 pl-3 ${isOwn ? 'border-amber-500/60' : 'border-zinc-800'}`}
              >
                <p className="text-zinc-500">
                  {isOwn ? 'You' : (message.sender?.name ?? 'Unknown')}{' '}
                  <span className="text-zinc-700">{formatUtcClockTime(message.createdAt)}</span>
                </p>
                <p className="text-zinc-200">{message.content}</p>
              </div>
            )
          })
        ) : (
          <p className="text-zinc-600">Room is quiet. Say hello.</p>
        )}
      </div>

      {canPost ? (
        <form
          className="flex shrink-0 gap-2 border-t border-zinc-800 p-4"
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
            placeholder="Message the room…"
            className="min-w-0 flex-1 border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-white"
            aria-label="Chat message"
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !draft.trim()}
            className="shrink-0 border border-white bg-white px-4 py-2 font-mono text-[10px] font-bold tracking-widest text-black uppercase disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-zinc-800 p-4">
          <p className="font-mono text-[10px] text-zinc-600">
            Read-only while offline.{' '}
            <button
              type="button"
              onClick={onSignInClick}
              className="text-zinc-300 underline underline-offset-2"
            >
              Sign in
            </button>{' '}
            to keep your identity.
          </p>
        </div>
      )}

      {sendMutation.isError ? (
        <p className="px-4 pb-2 font-mono text-xs text-red-400">{sendMutation.error.message}</p>
      ) : null}
      {guestSessionError ? (
        <p className="px-4 pb-2 font-mono text-xs text-red-400">{guestSessionError}</p>
      ) : null}
    </div>
  )
}

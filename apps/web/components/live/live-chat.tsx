'use client'

import { useLiveChat } from '@/components/live/use-live-chat'
import { formatRelativeTime, formatUtcClockTime, useClientMounted } from '@/lib/client-mounted'

export function LiveChat({ signedIn, userId }: { signedIn: boolean; userId?: string }) {
  const mounted = useClientMounted()
  const { draft, setDraft, messagesQuery, sendMutation, sendMessage, stats, pollingFallback } =
    useLiveChat({ signedIn, userId })

  return (
    <div className="border border-zinc-800 bg-black">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Live chat</p>
        <p className="mt-1 text-sm text-zinc-400">
          Demo channel — public read. Sign in to post. Messages are visible to everyone.
        </p>
        {stats ? (
          <p className="mt-2 font-mono text-[10px] text-zinc-600" suppressHydrationWarning>
            {stats.total} messages · latest{' '}
            {mounted
              ? formatRelativeTime(stats.latestAt)
              : stats.latestAt
                ? formatUtcClockTime(stats.latestAt)
                : 'no activity'}
            {mounted ? (pollingFallback ? ' · polling' : ' · live') : null}
          </p>
        ) : null}
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto p-4 font-mono text-xs">
        {messagesQuery.isPending ? (
          <p className="text-zinc-600">Loading chat…</p>
        ) : messagesQuery.isError ? (
          <p className="text-red-400">Chat unavailable — API may be offline.</p>
        ) : messagesQuery.data?.length ? (
          messagesQuery.data.map((message) => {
            const isOwn = userId && message.senderId === userId
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
          <p className="text-zinc-600">No messages yet. Say hello.</p>
        )}
      </div>

      {signedIn ? (
        <form
          className="flex gap-2 border-t border-zinc-800 p-4"
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
            placeholder="Type a message…"
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
        <p className="border-t border-zinc-800 p-4 font-mono text-[10px] text-zinc-600">
          Sign in on the You tab to post messages.
        </p>
      )}

      {sendMutation.isError ? (
        <p className="px-4 pb-4 font-mono text-xs text-red-400">{sendMutation.error.message}</p>
      ) : null}
    </div>
  )
}

'use client'

import { ChatComposer } from '@/components/live/chat-composer'
import { ChatMessageList } from '@/components/live/chat-message-list'
import { useLiveChat } from '@/components/live/use-live-chat'
import { formatRelativeTime, formatUtcClockTime, useClientMounted } from '@/lib/client-mounted'

export function LiveChat({
  signedIn,
  guestPostEnabled = false,
  userId,
}: {
  signedIn: boolean
  guestPostEnabled?: boolean
  userId?: string
}) {
  const mounted = useClientMounted()
  const canPost = signedIn || guestPostEnabled
  const {
    draft,
    setDraft,
    messagesQuery,
    sendMutation,
    sendMessage,
    guestSessionError,
    stats,
    pollingFallback,
  } = useLiveChat({ signedIn, guestPostEnabled, userId })

  return (
    <div className="flex h-full min-h-0 flex-col border-0 bg-black">
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="font-mono text-[10px] tracking-widest text-amber-400 uppercase">Live chat</p>
        <p className="mt-1 text-sm text-zinc-400">
          Shared demo room — everyone sees the same feed. Post as a guest or sign in to keep your
          identity.
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

      <ChatMessageList
        messages={messagesQuery.data}
        userId={userId}
        pending={messagesQuery.isPending}
        error={messagesQuery.isError}
      />

      {canPost ? (
        <ChatComposer
          draft={draft}
          onDraftChange={setDraft}
          onSend={sendMessage}
          sending={sendMutation.isPending}
        />
      ) : (
        <p className="shrink-0 border-t border-zinc-800 p-4 font-mono text-[10px] text-zinc-600">
          Chat is read-only while the API is offline.
        </p>
      )}

      {sendMutation.isError ? (
        <p className="px-4 pb-4 font-mono text-xs text-red-400">{sendMutation.error.message}</p>
      ) : null}
      {guestSessionError ? (
        <p className="px-4 pb-4 font-mono text-xs text-red-400">{guestSessionError}</p>
      ) : null}
    </div>
  )
}

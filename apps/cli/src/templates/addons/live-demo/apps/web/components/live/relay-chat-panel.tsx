'use client'

import { ChatComposer } from '@/components/live/chat-composer'
import { ChatMessageList } from '@/components/live/chat-message-list'
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

      <ChatMessageList
        messages={messagesQuery.data}
        userId={userId}
        pending={messagesQuery.isPending}
        error={messagesQuery.isError}
        loadingLabel="Loading feed…"
        errorLabel="Feed unavailable."
        emptyLabel="Room is quiet. Say hello."
      />

      {canPost ? (
        <ChatComposer
          draft={draft}
          onDraftChange={setDraft}
          onSend={sendMessage}
          sending={sendMutation.isPending}
          placeholder="Message the room…"
        />
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

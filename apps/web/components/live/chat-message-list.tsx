'use client'

import { useEffect, useRef } from 'react'

import { formatChatSenderLabel, type ChatMessageRow } from '@/lib/chat-display'
import { formatUtcClockTime } from '@/lib/client-mounted'

export function ChatMessageList({
  messages,
  userId,
  pending = false,
  error = false,
  emptyLabel = 'No messages yet. Say hello.',
  loadingLabel = 'Loading chat…',
  errorLabel = 'Chat unavailable — API may be offline.',
}: {
  messages?: ChatMessageRow[]
  userId?: string
  pending?: boolean
  error?: boolean
  emptyLabel?: string
  loadingLabel?: string
  errorLabel?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const latestId = messages?.at(-1)?.id

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [latestId, messages?.length])

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 font-mono text-xs"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      data-latest-message={latestId}
    >
      {pending ? (
        <p className="text-zinc-600">{loadingLabel}</p>
      ) : error ? (
        <p className="text-red-400">{errorLabel}</p>
      ) : messages?.length ? (
        messages.map((message) => {
          const isSystem = message.kind === 'system'
          const isOwn = Boolean(userId && message.senderId === userId)

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

          const label = formatChatSenderLabel(message, userId)

          return (
            <div
              key={message.id}
              className={`border-l-2 pl-3 ${isOwn ? 'border-amber-500/60' : 'border-zinc-800'}`}
            >
              <p className="text-zinc-500">
                <span className={isOwn ? 'text-amber-300/90' : undefined}>{label}</span>{' '}
                <span className="text-zinc-700">{formatUtcClockTime(message.createdAt)}</span>
              </p>
              <p className="text-zinc-200">{message.content}</p>
            </div>
          )
        })
      ) : (
        <p className="text-zinc-600">{emptyLabel}</p>
      )}
    </div>
  )
}

'use client'

import { useCallback, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLiveRoom } from '@/components/live/live-room-context'
import { useChatStream } from '@/components/live/use-chat-stream'
import { ensureGuestSession } from '@/lib/ensure-guest-session'
import { DEFAULT_POLL_INTERVAL_MS } from '@/lib/live-feed'
import { useTRPC } from '@/trpc/client'

export function deriveChatStats(messages: Array<{ createdAt: Date | string }> | undefined) {
  if (!messages?.length) return null
  const latest = messages[messages.length - 1]!
  const latestAt =
    latest.createdAt instanceof Date ? latest.createdAt.toISOString() : String(latest.createdAt)
  return { total: messages.length, latestAt }
}

export function useLiveChat({
  signedIn,
  userId,
  guestPostEnabled = false,
  useSharedRoom = false,
}: {
  signedIn: boolean
  userId?: string
  /** When true, guests can post after an anonymous session is created on send. */
  guestPostEnabled?: boolean
  /** When true, SSE is owned by LiveRoomProvider (no duplicate connection). */
  useSharedRoom?: boolean
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [guestSessionError, setGuestSessionError] = useState<string | null>(null)
  const room = useLiveRoom()

  const invalidateChat = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() })
  }, [queryClient, trpc.chat.list])

  const standalone = useChatStream(invalidateChat, !useSharedRoom && (signedIn || guestPostEnabled))
  const mode = useSharedRoom ? room.mode : standalone.mode
  const pollingFallback = useSharedRoom ? room.pollingFallback : standalone.pollingFallback

  const messagesQuery = useQuery({
    ...trpc.chat.list.queryOptions(),
    refetchInterval: () => {
      if (typeof document !== 'undefined' && document.hidden) return false
      return mode === 'poll' ? DEFAULT_POLL_INTERVAL_MS : false
    },
  })

  const stats = deriveChatStats(messagesQuery.data)

  const sendMutation = useMutation(
    trpc.chat.send.mutationOptions({
      onMutate: async ({ content }) => {
        await queryClient.cancelQueries({ queryKey: trpc.chat.list.queryKey() })
        const previous = queryClient.getQueryData(trpc.chat.list.queryKey())
        const optimisticId = `optimistic-${Date.now()}`
        queryClient.setQueryData(trpc.chat.list.queryKey(), (old) => {
          const list = old ?? []
          const optimistic = {
            id: optimisticId,
            content,
            kind: 'user' as const,
            senderId: userId ?? 'you',
            createdAt: new Date(),
            sender: { id: userId ?? 'you', name: 'You', image: null },
          } as (typeof list)[number]
          return [...list, optimistic]
        })
        return { previous, optimisticId }
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(trpc.chat.list.queryKey(), context.previous)
        }
      },
      onSuccess: async () => {
        setDraft('')
        invalidateChat()
      },
    }),
  )

  const sendMessage = useCallback(() => {
    const content = draft.trim()
    if (!content || sendMutation.isPending) return

    void (async () => {
      if (!signedIn && guestPostEnabled) {
        try {
          setGuestSessionError(null)
          await ensureGuestSession(queryClient, trpc.auth.getSession.queryKey(), () =>
            queryClient.fetchQuery(trpc.auth.getSession.queryOptions()),
          )
        } catch (error: unknown) {
          setGuestSessionError(
            error instanceof Error ? error.message : 'Could not start guest session',
          )
          return
        }
      }

      sendMutation.mutate({ content })
    })()
  }, [draft, guestPostEnabled, queryClient, sendMutation, signedIn, trpc.auth.getSession])

  return {
    draft,
    setDraft,
    messagesQuery,
    sendMutation,
    sendMessage,
    guestSessionError,
    stats,
    mode,
    pollingFallback,
  }
}

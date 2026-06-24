'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { useChatStream } from '@/components/live/use-chat-stream'
import { DEFAULT_POLL_INTERVAL_MS } from '@/lib/live-feed'
import { useTRPC } from '@/trpc/client'

export function deriveChatStats(messages: Array<{ createdAt: Date | string }> | undefined) {
  if (!messages?.length) return null
  const latest = messages[messages.length - 1]!
  const latestAt =
    latest.createdAt instanceof Date ? latest.createdAt.toISOString() : String(latest.createdAt)
  return { total: messages.length, latestAt }
}

export function useLiveChat({ signedIn, userId }: { signedIn: boolean; userId?: string }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')

  const invalidateChat = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() })
  }, [queryClient, trpc.chat.list])

  const { mode, pollingFallback } = useChatStream(invalidateChat, signedIn || true)

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
    sendMutation.mutate({ content })
  }, [draft, sendMutation])

  return {
    draft,
    setDraft,
    messagesQuery,
    sendMutation,
    sendMessage,
    stats,
    mode,
    pollingFallback,
  }
}

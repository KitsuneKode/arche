import { TRPCError } from '@trpc/server'

import { chatRepository } from './chat.repository'

/** Demo room limits — DB-backed so they work across horizontally scaled API instances. */
const MAX_MESSAGES_PER_MINUTE = 12
const MIN_SECONDS_BETWEEN_MESSAGES = 1
const DUPLICATE_WINDOW_MS = 5_000

export async function assertCanSendMessage(senderId: string, content: string) {
  const trimmed = content.trim()
  const now = Date.now()
  const sinceMinute = new Date(now - 60_000)

  const [recentCount, latest] = await Promise.all([
    chatRepository.countRecentBySender(senderId, sinceMinute),
    chatRepository.findLatestBySender(senderId),
  ])

  if (recentCount >= MAX_MESSAGES_PER_MINUTE) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Slow down — demo chat allows about 12 messages per minute.',
    })
  }

  if (latest) {
    const elapsedMs = now - latest.createdAt.getTime()
    if (elapsedMs < MIN_SECONDS_BETWEEN_MESSAGES * 1_000) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Please wait a moment before sending another message.',
      })
    }

    if (
      latest.content.trim().toLowerCase() === trimmed.toLowerCase() &&
      elapsedMs < DUPLICATE_WINDOW_MS
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Duplicate message — try something different.',
      })
    }
  }
}

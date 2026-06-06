/**
 * BullMQ-compatible Redis connection factory.
 */

import { Redis } from 'ioredis'
import { resolveRedisUrl } from '../utils/redis-enabled'

let bullConnection: Redis | null = null

export function getBullConnection(): Redis {
  if (bullConnection) return bullConnection

  const url = resolveRedisUrl()
  if (!url) {
    throw new Error('BullMQ requires REDIS_URL (queues are disabled when ENABLE_REDIS=false)')
  }

  bullConnection = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  return bullConnection
}

/** Separate connection for worker processes. */
export function createWorkerBullConnection(): Redis {
  const url = resolveRedisUrl()
  if (!url) {
    throw new Error('Worker requires REDIS_URL')
  }

  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

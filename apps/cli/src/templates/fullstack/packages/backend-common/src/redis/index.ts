import { createClient } from 'redis'
import { resolveRedisUrl } from '../utils/redis-enabled'

/** Application Redis handle for server/worker boot. BullMQ owns a separate ioredis adapter. */
export type AppRedisClient = {
  connect(): Promise<void>
  close(): Promise<void>
}

export const redisClient = (): AppRedisClient => {
  const url = resolveRedisUrl()
  if (!url) {
    throw new Error('REDIS_URL is not configured (set REDIS_URL or ENABLE_REDIS=false)')
  }

  const client = createClient({ url })
  client.on('error', (error) => {
    console.error('[redis] client error:', error)
  })

  return {
    async connect() {
      await client.connect()
    },
    async close() {
      await client.quit()
    },
  }
}

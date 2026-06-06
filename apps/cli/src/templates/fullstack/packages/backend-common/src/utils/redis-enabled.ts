import { serverEnv } from '../env'
import { envBoolean } from './env-boolean'

/** Background jobs (BullMQ) and /admin/queues require Redis when enabled. */
export function isRedisEnabled(): boolean {
  return envBoolean(serverEnv.ENABLE_REDIS, true)
}

export function resolveRedisUrl(): string | undefined {
  if (serverEnv.REDIS_URL) return serverEnv.REDIS_URL
  if (serverEnv.NODE_ENV === 'development') return 'redis://localhost:6379'
  return undefined
}

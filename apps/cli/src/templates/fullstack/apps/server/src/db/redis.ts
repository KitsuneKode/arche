import { redisClient } from '@arche-template/backend-common/redis'

export const redis = redisClient()

/** Connect during startup (after env validation). Avoids import-time failures on Render. */
export async function connectRedis(): Promise<void> {
  await redis.connect()
}

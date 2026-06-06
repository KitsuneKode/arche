import { redisClient } from '@arche-template/backend-common/redis'

export const redis = redisClient()

await redis.connect()

import { isRedisEnabled } from '@arche-template/backend-common/redis-enabled'

import { queues } from './queue'
import { logger } from './utils/logger'

const CLEANUP_REPEATABLE_KEY = 'stale-anonymous-users'
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000
const DEFAULT_ANONYMOUS_RETENTION_DAYS = 7

export async function ensureCleanupSchedule(): Promise<void> {
  if (!isRedisEnabled()) {
    logger.info('Redis disabled — skipping anonymous guest cleanup schedule')
    return
  }

  const repeatable = await queues.cleanup.getRepeatableJobs()
  for (const job of repeatable) {
    if (job.name === CLEANUP_REPEATABLE_KEY) {
      await queues.cleanup.removeRepeatableByKey(job.key)
    }
  }

  await queues.cleanup.add(
    CLEANUP_REPEATABLE_KEY,
    { olderThanDays: DEFAULT_ANONYMOUS_RETENTION_DAYS },
    {
      repeat: { every: CLEANUP_INTERVAL_MS },
    },
  )

  logger.info('Scheduled anonymous guest cleanup', {
    payload: {
      everyHours: CLEANUP_INTERVAL_MS / (60 * 60 * 1000),
      olderThanDays: DEFAULT_ANONYMOUS_RETENTION_DAYS,
    },
  })
}

/** Live-demo registers guest cleanup; minimal template leaves this as a no-op. */
export async function registerSchedules(): Promise<void> {
  await ensureCleanupSchedule()
}

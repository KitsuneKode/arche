import { deleteStaleAnonymousUsers } from '@arche-template/auth/server'
import type { Job } from 'bullmq'
import { logger } from '../utils/logger'

export type CleanupJobData = {
  olderThanDays: number
}

const DEFAULT_ANONYMOUS_RETENTION_DAYS = 7

export async function runCleanup(job: Job<CleanupJobData>): Promise<void> {
  const olderThanDays = job.data.olderThanDays ?? DEFAULT_ANONYMOUS_RETENTION_DAYS
  logger.info('Running cleanup', { payload: { olderThanDays, attempt: job.attemptsMade } })

  const removed = await deleteStaleAnonymousUsers(olderThanDays)
  logger.info('Cleanup complete', { payload: { olderThanDays, removedAnonymousUsers: removed } })
}

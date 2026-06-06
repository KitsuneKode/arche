import type { Job } from 'bullmq'
import { logger } from '../utils/logger'

export type CleanupJobData = {
  olderThanDays: number
}

export async function runCleanup(job: Job<CleanupJobData>): Promise<void> {
  const { olderThanDays } = job.data
  logger.info('Running cleanup', { payload: { olderThanDays, attempt: job.attemptsMade } })
  // TODO: clean up expired sessions, old logs, etc.
  await new Promise((resolve) => setTimeout(resolve, 200))
  logger.info('Cleanup complete', { payload: { olderThanDays } })
}

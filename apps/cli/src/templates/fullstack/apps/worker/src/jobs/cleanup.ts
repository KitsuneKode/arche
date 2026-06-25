import type { Job } from 'bullmq'
import { logger } from '../utils/logger'

export type CleanupJobData = {
  task?: string
}

/** Default cleanup handler — extend when you add retention or housekeeping jobs. */
export async function runCleanup(job: Job<CleanupJobData>): Promise<void> {
  logger.info('Cleanup job received (no default tasks configured)', {
    payload: { jobId: job.id, task: job.data.task ?? 'none' },
  })
}

import { logger } from '@/utils/logger'
import { sendEmail, processWebhook, runCleanup } from './jobs'
import { createWorker, QUEUE_NAMES } from './queue'
import { ensureCleanupSchedule } from './schedule'

const emailWorker = createWorker(QUEUE_NAMES.EMAIL, sendEmail)
const webhookWorker = createWorker(QUEUE_NAMES.WEBHOOK, processWebhook)
const cleanupWorker = createWorker(QUEUE_NAMES.CLEANUP, runCleanup)

void ensureCleanupSchedule().catch((error: unknown) => {
  logger.error('Failed to schedule cleanup jobs', {
    payload: { error: error instanceof Error ? error.message : 'Unknown error' },
  })
})

logger.info('Worker started — listening for jobs')

process.on('SIGTERM', async () => {
  logger.info('Shutting down workers')
  await Promise.all([emailWorker.close(), webhookWorker.close(), cleanupWorker.close()])
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('Shutting down workers')
  await Promise.all([emailWorker.close(), webhookWorker.close(), cleanupWorker.close()])
  process.exit(0)
})

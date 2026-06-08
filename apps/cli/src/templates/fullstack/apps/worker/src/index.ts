import { validateEnvironment } from '@arche-template/backend-common/validate-env'
import { logger } from '@/utils/logger'
import { sendEmail, processWebhook, runCleanup } from './jobs'
import { createWorker, QUEUE_NAMES } from './queue'
import { connectRedis } from './redis'

validateEnvironment('worker')
await connectRedis()

const emailWorker = createWorker(QUEUE_NAMES.EMAIL, sendEmail)
const webhookWorker = createWorker(QUEUE_NAMES.WEBHOOK, processWebhook)
const cleanupWorker = createWorker(QUEUE_NAMES.CLEANUP, runCleanup)

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

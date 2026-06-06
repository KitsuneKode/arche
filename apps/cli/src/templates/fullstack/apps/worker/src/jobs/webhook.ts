import type { Job } from 'bullmq'
import { logger } from '../utils/logger'

export type WebhookJobData = {
  provider: 'stripe' | 'github' | 'custom'
  event: string
  payload: unknown
}

export async function processWebhook(job: Job<WebhookJobData>): Promise<void> {
  const { provider, event } = job.data
  logger.info('Processing webhook', { payload: { provider, event, attempt: job.attemptsMade } })
  // TODO: implement provider-specific handlers
  await new Promise((resolve) => setTimeout(resolve, 50))
  logger.info('Webhook processed', { payload: { provider, event } })
}

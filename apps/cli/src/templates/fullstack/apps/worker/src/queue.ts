import { createWorkerBullConnection as createConnection } from '@arche-template/backend-common/redis/bull'
import { Queue, Worker } from 'bullmq'
import type { CleanupJobData } from './jobs/cleanup'
import type { EmailJobData } from './jobs/email'
import type { WebhookJobData } from './jobs/webhook'

const connection = createConnection()

export const QUEUE_NAMES = {
  EMAIL: 'email',
  WEBHOOK: 'webhook',
  CLEANUP: 'cleanup',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

export const queues = {
  email: new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, { connection }),
  webhook: new Queue<WebhookJobData>(QUEUE_NAMES.WEBHOOK, { connection }),
  cleanup: new Queue<CleanupJobData>(QUEUE_NAMES.CLEANUP, { connection }),
} as const

export function createWorker(
  queueName: QueueName,
  handler: (job: import('bullmq').Job) => Promise<void>,
): Worker {
  return new Worker(queueName, handler, {
    connection,
    concurrency: 5,
  })
}

import type { Job } from 'bullmq'
import { logger } from '../utils/logger'

export type EmailJobData = {
  to: string
  subject: string
  body: string
}

export async function sendEmail(job: Job<EmailJobData>): Promise<void> {
  const { to, subject } = job.data
  logger.info('Sending email', { payload: { to, subject, attempt: job.attemptsMade } })
  // TODO: integrate with Resend or SendGrid
  await new Promise((resolve) => setTimeout(resolve, 100))
  logger.info('Email sent', { payload: { to, subject } })
}

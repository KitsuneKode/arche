import { getBullConnection } from '@arche-template/backend-common/redis/bull'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { Queue } from 'bullmq'

const QUEUE_NAMES = ['email', 'webhook', 'cleanup'] as const

let serverAdapter: ExpressAdapter | null = null

export function getAdminQueueAdapter(): ExpressAdapter {
  if (serverAdapter) return serverAdapter

  const connection = getBullConnection()
  const queues = QUEUE_NAMES.map((name) => new Queue(name, { connection }))

  serverAdapter = new ExpressAdapter()
  serverAdapter.setBasePath('/admin/queues')

  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter,
  })

  return serverAdapter
}

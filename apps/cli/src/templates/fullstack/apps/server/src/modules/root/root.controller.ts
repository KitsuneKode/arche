import { isRedisEnabled } from '@arche-template/backend-common/redis-enabled'
import type { Request, Response } from 'express'

const SERVICE_VERSION = '1.0.0'

export const rootController = {
  async getRoot(_req: Request, res: Response) {
    const links: Record<string, string> = {
      health: '/health',
      trpc: '/api/trpc',
      auth: '/api/auth',
    }
    if (isRedisEnabled()) {
      links.queues = '/admin/queues'
    }

    res.json({
      service: '@arche-template/server',
      title: 'Arche API',
      status: 'ok',
      version: SERVICE_VERSION,
      environment: process.env.NODE_ENV ?? 'development',
      redis: isRedisEnabled() ? 'enabled' : 'disabled',
      links,
      hint: 'Load balancers use GET /health. tRPC clients call /api/trpc.',
    })
  },
}

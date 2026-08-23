import { getDemoCapabilities } from '@arche-template/backend-common/demo-policy'
import { isRedisEnabled } from '@arche-template/backend-common/redis-enabled'

import { prisma } from '../../db/index'
import { chatRepository } from '../chat/chat.repository'
import { healthService } from '../health/health.service'
import type { DemoStackSnapshot } from './demo.dto'

export const demoService = {
  async stackSnapshot(): Promise<DemoStackSnapshot> {
    const [health, chatStats, publishedPostCount, leaderboardRows] = await Promise.all([
      healthService.check(),
      chatRepository.getStats(),
      prisma.post.count({ where: { published: true } }),
      prisma.relayRunScore
        .groupBy({
          by: ['userId'],
          _max: { score: true },
        })
        .then((rows) => rows.length)
        .catch(() => 0),
    ])

    return {
      fetchedAt: new Date().toISOString(),
      health: {
        status: health.status,
        database: health.database,
        schema: health.schema,
      },
      capabilities: getDemoCapabilities(),
      redis: isRedisEnabled() ? 'enabled' : 'disabled',
      feeds: {
        chatMessageCount: chatStats.total,
        chatLatestAt: chatStats.latestAt,
        publishedPostCount,
        leaderboardEntryCount: leaderboardRows,
      },
    }
  },
}

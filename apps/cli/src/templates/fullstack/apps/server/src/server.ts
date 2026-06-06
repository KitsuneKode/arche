/**
 * Server startup script
 *
 * Handles environment validation, graceful shutdown, and cluster management.
 */

import { setupGracefulShutdown, onShutdown } from '@arche-template/backend-common/graceful-shutdown'
import { isRedisEnabled } from '@arche-template/backend-common/redis-enabled'
import { validateEnvironment } from '@arche-template/backend-common/validate-env'
import app from './app'
import { env } from './common/env'
import { logger } from './common/logger'
import { prisma } from './db/index.js'
import { connectRedis, redis } from './db/redis.js'

function resolveListenPort(): number {
  const raw = process.env.PORT
  if (raw) {
    const parsed = Number(raw)
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 65535) {
      return parsed
    }
    console.error(`[server] Invalid PORT="${raw}" — must be a number between 1 and 65535`)
    process.exit(1)
  }
  return env.PORT
}

function logStartupFailure(label: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(`[server] ${label}: ${message}`)
  if (stack) {
    console.error(stack)
  }
}

process.on('unhandledRejection', (reason) => {
  logStartupFailure('Unhandled promise rejection', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logStartupFailure('Uncaught exception', error)
  process.exit(1)
})

async function main(): Promise<void> {
  validateEnvironment('server')

  const PORT = resolveListenPort()
  const HOST = process.env.HOST ?? '0.0.0.0'

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const instance = app.listen(PORT, HOST, () => {
      logger.info({
        host: HOST,
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      })
      console.log(`[server] listening on http://${HOST}:${PORT}`)
      resolve(instance)
    })
    instance.on('error', reject)
  })

  if (isRedisEnabled()) {
    try {
      await connectRedis()
      logger.info('Redis connected')
    } catch (error) {
      logStartupFailure('Redis connection failed (check REDIS_URL)', error)
      server.close()
      process.exit(1)
    }
  } else {
    logger.info('Redis disabled (ENABLE_REDIS=false) — no BullMQ or /admin/queues')
  }

  onShutdown(async () => {
    logger.info('Closing Prisma connection...')
    await prisma.$disconnect()
  })

  if (isRedisEnabled()) {
    onShutdown(async () => {
      logger.info('Closing Redis connection...')
      await redis.close()
    })
  }

  setupGracefulShutdown(server)
}

main().catch((error) => {
  logStartupFailure('Startup failed', error)
  process.exit(1)
})

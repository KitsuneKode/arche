/**
 * Graceful shutdown handler
 *
 * Properly close connections and clean up resources when the process terminates.
 * Prevents data loss and ensures all pending operations complete.
 */

const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
}

const shutdownCallbacks: Array<() => Promise<void>> = []
let isShuttingDown = false

/**
 * Register a callback to run during shutdown
 */
export function onShutdown(callback: () => Promise<void>) {
  shutdownCallbacks.push(callback)
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(server: any) {
  async function shutdown(signal: string) {
    if (isShuttingDown) return
    isShuttingDown = true

    logger.info(`${signal} received, starting graceful shutdown...`)

    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit')
      process.exit(1)
    }, 30000) // 30 second timeout

    try {
      // Close HTTP server (stop accepting new connections)
      if (server) {
        await new Promise<void>((resolve) => {
          server.close(() => {
            logger.info('HTTP server closed')
            resolve()
          })
        })
      }

      // Run all registered shutdown callbacks (close DB, cache, etc.)
      for (const callback of shutdownCallbacks) {
        try {
          await callback()
        } catch (error) {
          logger.error(`Shutdown callback failed: ${error}`)
        }
      }

      clearTimeout(forceExitTimer)
      logger.info('Graceful shutdown complete')
      process.exit(0)
    } catch (error) {
      logger.error(`Error during shutdown: ${error}`)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error}`)
    shutdown('uncaughtException')
  })

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`)
    shutdown('unhandledRejection')
  })
}

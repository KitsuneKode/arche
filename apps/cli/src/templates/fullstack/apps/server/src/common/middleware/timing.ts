import type { NextFunction, Request, Response } from 'express'
import { env } from '../env'
import { logger } from '../logger'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const timingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint()

  if (env.NODE_ENV === 'development') {
    const waitMs = Math.floor(Math.random() * 400) + 100
    await sleep(waitMs)
  }

  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const latencyMs = Number(end - start) / 1_000_000
    logger.info(`${req.method} ${req.originalUrl} → ${latencyMs.toFixed(2)} ms`)
  })

  next()
}

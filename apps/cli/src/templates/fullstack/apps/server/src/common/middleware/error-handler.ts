import type { NextFunction, Request, Response } from 'express'
import { AppError, isAppError } from '../errors'
import { logger } from '../logger'

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = isAppError(error) ? error.status : 500
  const code = isAppError(error) ? error.code : 'INTERNAL_SERVER_ERROR'
  const message = error.message || 'An unexpected error occurred'

  logger.error({
    code,
    status,
    message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  })

  res.status(status).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  })
}

export { AppError }

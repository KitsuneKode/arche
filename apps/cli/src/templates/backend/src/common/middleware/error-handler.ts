import type { NextFunction, Request, Response } from 'express'
import { isAppError } from '../errors.js'

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = isAppError(error) ? error.status : 500
  const code = isAppError(error) ? error.code : 'INTERNAL_SERVER_ERROR'
  const message = error.message || 'An unexpected error occurred'

  res.status(status).json({
    error: { code, message },
  })
}

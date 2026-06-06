import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

export const tracingMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const requestId = crypto.randomUUID()
  req.headers['x-request-id'] = requestId
  ;(req as unknown as Record<string, unknown>).requestId = requestId
  next()
}

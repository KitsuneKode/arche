import type { Request } from 'express'
import { z } from 'zod'
import { AppError } from './errors.js'

export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const result = await schema.safeParseAsync(req.body)
  if (!result.success) {
    throw new AppError('Invalid request body', 400, 'BAD_REQUEST')
  }
  return result.data
}

export function parseQuery<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  const result = schema.safeParse(req.query)
  if (!result.success) {
    throw new AppError('Invalid query parameters', 400, 'BAD_REQUEST')
  }
  return result.data
}

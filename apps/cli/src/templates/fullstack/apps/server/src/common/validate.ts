import type { Request } from 'express'
import { z } from 'zod'
import { BadRequestError } from './errors'

export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const result = await schema.safeParseAsync(req.body)
  if (!result.success) {
    throw new BadRequestError('Invalid request body')
  }
  return result.data
}

export function parseParams<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  const result = schema.safeParse(req.params)
  if (!result.success) {
    throw new BadRequestError('Invalid route parameters')
  }
  return result.data
}

export function parseQuery<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  const result = schema.safeParse(req.query)
  if (!result.success) {
    throw new BadRequestError('Invalid query parameters')
  }
  return result.data
}

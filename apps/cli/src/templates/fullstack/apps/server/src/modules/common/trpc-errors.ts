import { TRPCError } from '@trpc/server'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors'

export async function withAppErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
    }
    if (error instanceof NotFoundError) {
      throw new TRPCError({ code: 'NOT_FOUND', message: error.message })
    }
    if (error instanceof UnauthorizedError) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: error.message })
    }
    if (error instanceof BadRequestError) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
    }
    throw error
  }
}

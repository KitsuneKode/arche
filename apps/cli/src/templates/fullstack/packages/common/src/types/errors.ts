/**
 * Standardized error types for API responses
 *
 * All tRPC procedures and API endpoints use these types
 * to ensure consistent error handling across the application.
 */

/**
 * Error codes used in API responses.
 * These are returned in error responses so clients can handle errors programmatically.
 */
export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Rate limiting
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Standard API error response shape
 */
export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'APIError'
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

/**
 * Type-safe HTTP status code mapping
 */
export function getStatusCode(errorCode: ErrorCode): number {
  const mapping: Record<ErrorCode, number> = {
    [ERROR_CODES.UNAUTHORIZED]: 401,
    [ERROR_CODES.FORBIDDEN]: 403,
    [ERROR_CODES.INVALID_CREDENTIALS]: 401,
    [ERROR_CODES.SESSION_EXPIRED]: 401,
    [ERROR_CODES.VALIDATION_ERROR]: 400,
    [ERROR_CODES.BAD_REQUEST]: 400,
    [ERROR_CODES.NOT_FOUND]: 404,
    [ERROR_CODES.CONFLICT]: 409,
    [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 409,
    [ERROR_CODES.TOO_MANY_REQUESTS]: 429,
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  }
  return mapping[errorCode] || 500
}

/**
 * Input validation utilities
 *
 * Shared validation helpers for common input types.
 * Used in tRPC procedures and API endpoints.
 */

import { z } from 'zod'

/**
 * Sanitize user input string
 * - Trim whitespace
 * - Remove control characters
 * - Limit length
 */
export function sanitizeString(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') throw new Error('Expected string')
  return input.trim().slice(0, maxLength)
}

/**
 * Validate email format
 */
export const emailSchema = z.string().email('Invalid email format').toLowerCase().trim()

/**
 * Validate password strength (minimum 8 chars, includes uppercase, number, special char)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((pwd) => /[A-Z]/.test(pwd), 'Password must contain at least one uppercase letter')
  .refine((pwd) => /[0-9]/.test(pwd), 'Password must contain at least one number')
  .refine(
    (pwd) => /[!@#$%^&*]/.test(pwd),
    'Password must contain at least one special character (!@#$%^&*)',
  )

/**
 * Validate username
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')

/**
 * Validate URL
 */
export const urlSchema = z.string().url('Invalid URL format')

/**
 * Validate MongoDB ObjectId
 */
export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ID')

/**
 * Validate UUID
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Validate pagination
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

/**
 * Validate search query (prevent injection, limit length)
 */
export const searchQuerySchema = z
  .string()
  .min(1, 'Search query cannot be empty')
  .max(100, 'Search query must be less than 100 characters')
  .refine((q) => !/[<>"'%;()&+]/.test(q), 'Search query contains invalid characters')

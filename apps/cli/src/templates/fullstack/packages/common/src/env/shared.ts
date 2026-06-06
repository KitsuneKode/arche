/**
 * Shared environment variables used across frontend and backend.
 * These are the minimal set of variables that both client and server need to know about.
 */

import { z } from 'zod'

export const sharedEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export type SharedEnv = z.infer<typeof sharedEnvSchema>

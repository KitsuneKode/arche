/**
 * Enhanced configuration with better defaults and documentation
 */

import { z } from 'zod'

const baseConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().int().min(1).max(65535).default(3001),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  corsOrigin: z.string().url(),
  requestTimeout: z.number().default(30000), // 30 seconds
  maxJsonSize: z.string().default('1mb'),
})

export const serverConfigSchema = baseConfigSchema.extend({
  databaseUrl: z.string().optional(),
  redisUrl: z.string().optional(),
  frontendUrl: z.string().url(),
  betterAuthUrl: z.string().url(),
  betterAuthSecret: z.string().min(32),
  rateLimitWindow: z.number().default(15 * 60 * 1000), // 15 minutes
  rateLimitMax: z.number().default(100), // requests per window
})

export const workerConfigSchema = baseConfigSchema.extend({
  redisUrl: z.string().optional(),
  concurrency: z.number().int().min(1).default(5),
  maxProcessingTime: z.number().default(30000), // 30 seconds
})

/**
 * Configuration best practices:
 *
 * 1. All config from environment (12-factor app)
 * 2. Validate on startup (fail fast)
 * 3. Type-safe config with Zod
 * 4. Document all config options
 * 5. Use sensible defaults
 * 6. Log config on startup (without secrets)
 */

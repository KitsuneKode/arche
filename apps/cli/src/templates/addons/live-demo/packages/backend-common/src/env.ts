/**
 * Backend (server, worker, CLI) environment variables.
 * Uses t3-env-core for runtime validation on Node.js.
 */

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { envBooleanSchema } from './utils/env-boolean'

export const serverEnv = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    DATABASE_URL: z.string().url(),
    ENABLE_REDIS: envBooleanSchema(true).default(true),
    REDIS_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    BETTER_AUTH_SECRET: z.string().min(32, 'Must be at least 32 characters for security'),
    BETTER_AUTH_URL: z.string().url(),
    DEMO_AUTO_SIGN_IN: envBooleanSchema(false).default(false),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  },
  clientPrefix: undefined,
  client: {},
  runtimeEnv: {
    ...process.env,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? process.env.RENDER_EXTERNAL_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI || !!process.env.VERCEL || !!process.env.RENDER,
})

export type ServerEnv = typeof serverEnv

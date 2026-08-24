/**
 * Frontend environment variables for Next.js.
 * All public variables are prefixed with NEXT_PUBLIC_.
 *
 * This is auto-validated at build time and runtime by Next.js/t3-env.
 * Type-safe access: just import and use env.VARIABLE_NAME
 */

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

function vercelWebOrigin(): string | undefined {
  const host = process.env.VERCEL_URL?.trim()
  return host ? `https://${host}` : undefined
}

export const clientEnv = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:8080'),
  },
  clientPrefix: 'NEXT_PUBLIC_',
  runtimeEnvStrict: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ?? vercelWebOrigin() ?? 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI || !!process.env.VERCEL,
})

export type ClientEnv = typeof clientEnv

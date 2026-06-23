import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

function vercelWebOrigin(): string | undefined {
  const host = process.env.VERCEL_URL?.trim()
  return host ? `https://${host}` : undefined
}

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? vercelWebOrigin(),
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})

export default env

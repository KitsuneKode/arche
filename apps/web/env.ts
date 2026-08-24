/**
 * Frontend app environment (Next.js).
 * Extends shared client env with any web-specific variables.
 *
 * Usage in components:
 * import { env } from '@/env'
 * export const Component = () => env.NEXT_PUBLIC_APP_URL
 */

import { clientEnv } from '@arche-template/common/env'
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/** Dashboard typos like the literal string "undefined" must not reach `new URL()`. */
function sanitizePublicEnv(value: string | undefined): string | undefined {
  if (value === undefined || value === '') return undefined
  const trimmed = value.trim()
  if (trimmed === 'undefined' || trimmed === 'null') return undefined
  return trimmed
}

function vercelDeploymentOrigin(): string | undefined {
  const host = sanitizePublicEnv(process.env.VERCEL_URL)
  return host ? `https://${host}` : undefined
}

const vercelOrigin = vercelDeploymentOrigin()

const publicSiteUrl =
  sanitizePublicEnv(process.env.NEXT_PUBLIC_SITE_URL) ??
  sanitizePublicEnv(process.env.NEXT_PUBLIC_APP_URL) ??
  vercelOrigin

const publicAppUrl = sanitizePublicEnv(process.env.NEXT_PUBLIC_APP_URL) ?? vercelOrigin

const defaultSiteDescription =
  'Personal project origin system — TypeScript, Rust, and Solana scaffolds with agent-readable context.'

/** Applied in runtimeEnv so Vercel/CI builds get defaults when skipValidation is on. */
const publicSiteName = sanitizePublicEnv(process.env.NEXT_PUBLIC_SITE_NAME) ?? 'Arche'
const publicSiteDescription =
  sanitizePublicEnv(process.env.NEXT_PUBLIC_SITE_DESCRIPTION) ?? defaultSiteDescription

export const env = createEnv({
  extends: [clientEnv],
  client: {
    NEXT_PUBLIC_SITE_NAME: z.string().default('Arche'),
    NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_SITE_DESCRIPTION: z.string().default(defaultSiteDescription),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:8080'),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SITE_NAME: publicSiteName,
    NEXT_PUBLIC_SITE_URL: publicSiteUrl,
    NEXT_PUBLIC_SITE_DESCRIPTION: publicSiteDescription,
    NEXT_PUBLIC_APP_URL: publicAppUrl ?? 'http://localhost:3000',
    NEXT_PUBLIC_API_URL:
      sanitizePublicEnv(process.env.NEXT_PUBLIC_API_URL) ?? 'http://localhost:8080',
  },
  emptyStringAsUndefined: true,
  // CI/Vercel set CI=1; runtime fallbacks above must stay in sync with Zod defaults.
  skipValidation: !!process.env.CI || !!process.env.VERCEL,
})

export type Env = typeof env

export default env

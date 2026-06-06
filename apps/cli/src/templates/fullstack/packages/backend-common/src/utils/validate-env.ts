/**
 * Environment validation and startup checks
 *
 * Uses parsed serverEnv (t3-env + defaults) — not raw process.env — so local defaults
 * and emptyStringAsUndefined behave consistently.
 */

import { serverEnv } from '../env'
import { isRedisEnabled, resolveRedisUrl } from './redis-enabled'

export function validateEnvironment(target: 'server' | 'worker' | 'web'): void {
  const errors: string[] = []

  if (target === 'server' || target === 'worker') {
    if (!serverEnv.DATABASE_URL) {
      errors.push('Missing required: DATABASE_URL')
    }

    if (!serverEnv.BETTER_AUTH_SECRET) {
      errors.push('Missing required: BETTER_AUTH_SECRET (min 32 characters)')
    }

    const needsRedis = target === 'worker' || isRedisEnabled()
    if (needsRedis && !resolveRedisUrl()) {
      errors.push(
        target === 'worker'
          ? 'Missing required: REDIS_URL (worker requires Redis for BullMQ)'
          : 'Missing required: REDIS_URL (set Key Value URL, or ENABLE_REDIS=false for API-only)',
      )
    }

    const hasGitHub = Boolean(serverEnv.GITHUB_CLIENT_ID) || Boolean(serverEnv.GITHUB_CLIENT_SECRET)
    if (hasGitHub) {
      if (!serverEnv.GITHUB_CLIENT_ID || !serverEnv.GITHUB_CLIENT_SECRET) {
        errors.push('Both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set together')
      }
    }

    const hasGoogle = Boolean(serverEnv.GOOGLE_CLIENT_ID) || Boolean(serverEnv.GOOGLE_CLIENT_SECRET)
    if (hasGoogle) {
      if (!serverEnv.GOOGLE_CLIENT_ID || !serverEnv.GOOGLE_CLIENT_SECRET) {
        errors.push('Both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together')
      }
    }
  }

  if (target === 'server') {
    if (!serverEnv.FRONTEND_URL) {
      errors.push('Missing required: FRONTEND_URL (Vercel web URL for CORS / auth callbacks)')
    }
    const betterAuthUrl = serverEnv.BETTER_AUTH_URL || process.env.RENDER_EXTERNAL_URL
    if (!betterAuthUrl) {
      errors.push(
        'Missing required: BETTER_AUTH_URL (on Render, set it or rely on RENDER_EXTERNAL_URL from the platform)',
      )
    }
  }

  if (target === 'web') {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      errors.push('Missing required: NEXT_PUBLIC_API_URL')
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:')
    for (const e of errors) {
      console.error(`   - ${e}`)
    }
    console.error('')
    console.error('📋 Local: copy apps/server/.env.example → .env and fill values.')
    if (process.env.RENDER) {
      console.error('')
      console.error('Render quick fixes:')
      console.error(
        '  • Blueprint: root render.yaml — set DATABASE_URL (Neon) and REDIS_URL (Upstash) in dashboard.',
      )
      console.error('  • Or ENABLE_REDIS=false (no queues). See docs/deployment-render.md')
      console.error('  • Start: cd apps/server && HOST=0.0.0.0 bun run start')
      console.error('  • Do not set PORT in the dashboard — Render injects it.')
      console.error('  • See docs/deployment-render.md')
    }
    process.exit(1)
  }
}

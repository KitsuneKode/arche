import { isDemoAutoSignInEnabled } from '@arche-template/backend-common/demo-policy'
import { prisma } from '@arche-template/store'
import { betterAuth } from 'better-auth'
export { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { anonymous } from 'better-auth/plugins'
import { migrateGuestData } from './migrate-guest-data'

export { guestDisplayName, resolveDisplayName } from './guest-display-name'
export { migrateGuestData, deleteStaleAnonymousUsers } from './migrate-guest-data'

const authBaseUrl = process.env.BETTER_AUTH_URL?.trim()
const frontendUrl = process.env.FRONTEND_URL?.trim()
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim()
const authSecret =
  process.env.BETTER_AUTH_SECRET?.trim() ||
  (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE || process.env.CI
    ? 'development-fallback-secret-minimum-32-chars-long'
    : undefined)

export const auth = betterAuth({
  secret: authSecret,
  baseURL:
    authBaseUrl ||
    (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE || process.env.CI
      ? 'http://localhost:8080'
      : undefined),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: frontendUrl ? [frontendUrl] : [],
  advanced: cookieDomain
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: cookieDomain,
        },
      }
    : undefined,
  emailAndPassword: {
    enabled: true,
    autoSignIn: isDemoAutoSignInEnabled(),
  },
  plugins: [
    anonymous({
      emailDomainName: 'guest.local',
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await migrateGuestData(anonymousUser.user.id, newUser.user.id)
      },
    }),
  ],
  socialProviders: {
    //   github: {
    //     clientId: process.env.GITHUB_CLIENT_ID as string,
    //     clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    //   },
    //   google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID as string,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    //   },
  },
})

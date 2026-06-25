import { isDemoAutoSignInEnabled } from '@arche-template/backend-common/demo-policy'
import { prisma } from '@arche-template/store'
import { betterAuth } from 'better-auth'
export { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { anonymous } from 'better-auth/plugins'
import { migrateGuestData } from './migrate-guest-data.js'

export { guestDisplayName, resolveDisplayName } from './guest-display-name.js'
export { migrateGuestData, deleteStaleAnonymousUsers } from './migrate-guest-data.js'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [],
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

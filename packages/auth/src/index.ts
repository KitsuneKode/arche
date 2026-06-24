import { prisma } from '@arche-template/store'
import { betterAuth } from 'better-auth'
export { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { prismaAdapter } from 'better-auth/adapters/prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [],
  emailAndPassword: {
    enabled: true,
    autoSignIn: process.env.NODE_ENV !== 'production' || process.env.DEMO_AUTO_SIGN_IN === 'true',
  },
  plugins: [], // make sure this is the last plugin in the array
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

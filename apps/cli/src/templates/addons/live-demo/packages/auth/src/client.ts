import { clientEnv as env } from '@arche-template/common/env'
import { anonymousClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react' // make sure to import from better-auth/react

/**
 * Better Auth client for frontend use.
 *
 * TODO: Type this properly once Better Auth exports a usable type.
 * Current issue: createAuthClient returns a type that references internal
 * Better Auth files that can't be serialized to .d.ts files.
 * See: https://github.com/better-auth/better-auth/issues
 */
type AuthClientWithAnonymous = {
  signIn: {
    anonymous: () => Promise<{ error?: { message?: string } | null }>
  }
}

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  plugins: [anonymousClient()],
}) as ReturnType<typeof createAuthClient>

export async function signInAnonymous() {
  return (authClient as unknown as AuthClientWithAnonymous).signIn.anonymous()
}

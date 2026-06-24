import { envBoolean } from './utils/env-boolean'

/** Whether email sign-up should auto-establish a session (marketing /live demo). */
export function isDemoAutoSignInEnabled(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv !== 'production' || envBoolean(process.env.DEMO_AUTO_SIGN_IN, false)
}

export type DemoChatSyncMode = 'sse' | 'poll'

/** API hint for long-lived hosts; web still uses build-time SSE flag for the client. */
export function resolveDemoChatSyncMode(): DemoChatSyncMode {
  return process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? 'poll' : 'sse'
}

export function getDemoCapabilities() {
  return {
    autoSignIn: isDemoAutoSignInEnabled(),
    chatSync: resolveDemoChatSyncMode(),
  }
}

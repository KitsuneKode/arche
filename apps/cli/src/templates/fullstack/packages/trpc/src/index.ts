/**
 * @arche-template/trpc — client-facing API contract
 *
 * Implementation lives in apps/server/src/modules (module-first architecture).
 * Server callers: import from `@arche-template/server/trpc`.
 */

export type { AppRouter, RouterInputs, RouterOutputs } from '@arche-template/server/trpc'

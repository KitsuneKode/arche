/**
 * @arche-template/backend-common
 *
 * Shared backend toolkit for server, worker, and CLI.
 * Prefer subpath imports for tree-shaking:
 *
 *   import { serverEnv } from '@arche-template/backend-common/env'
 *   import { logger } from '@arche-template/backend-common/logger'
 *   import { redis } from '@arche-template/backend-common/redis'
 */

export { serverEnv } from './env'

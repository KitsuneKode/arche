/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev` or `bun run convex:codegen` after linking a deployment.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server'
import type * as auth from '../auth.js'
import type * as posts from '../posts.js'

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth
  posts: typeof posts
}>
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>
